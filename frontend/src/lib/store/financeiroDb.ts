import { pool } from "./db";
import { criarCobrancaPix } from "../mercadopago";

let tabelaVerificada = false;

export async function garantirTabelaFinanceiro() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS boletos_financeiro (
      id SERIAL PRIMARY KEY,
      condominio_id INTEGER DEFAULT 1 NOT NULL,
      unidade VARCHAR(100) NOT NULL,
      competencia VARCHAR(50) NOT NULL,
      valor_num NUMERIC(10,2) NOT NULL,
      data_vencimento DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
      codigo_barras VARCHAR(150) NOT NULL,
      pix_copia_cola TEXT NOT NULL,
      detalhamento JSONB NOT NULL DEFAULT '[]'::jsonb,
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE boletos_financeiro ADD COLUMN IF NOT EXISTS condominio_id INTEGER DEFAULT 1 NOT NULL;
    ALTER TABLE boletos_financeiro ADD COLUMN IF NOT EXISTS mercadopago_order_id VARCHAR(64);
  `);


  // Atualiza para VENCIDO caso a data de vencimento seja anterior a hoje e o status ainda seja PENDENTE
  await pool.query(`
    UPDATE boletos_financeiro
    SET status = 'VENCIDO'
    WHERE status = 'PENDENTE' AND data_vencimento < CURRENT_DATE
  `);

  const check = await pool.query("SELECT COUNT(*) as total FROM boletos_financeiro");
  if (parseInt(check.rows[0].total, 10) === 0) {
    const itensPadrão = JSON.stringify([
      { item: "Taxa Condominial Ordinária", valor: 680.0 },
      { item: "Fundo de Reserva (10%)", valor: 68.0 },
      { item: "Consumo Individual de Água/Gás", valor: 102.0 },
    ]);

    await pool.query(`
      INSERT INTO boletos_financeiro (
        unidade, competencia, valor_num, data_vencimento, status,
        codigo_barras, pix_copia_cola, detalhamento
      ) VALUES
      (
        'Apto 301',
        'Julho/2026',
        850.00,
        (CURRENT_DATE + INTERVAL '5 days')::date,
        'PENDENTE',
        '34191.79001 01043.510047 91020.150008 1 97890000085000',
        '00020126580014br.gov.bcb.pix0136condominio.tailson@pix.com.br5204000053039865405850.005802BR5919CONDOMINIO TAILSON6009SAO PAULO62070503***6304A1B2',
        $1::jsonb
      ),
      (
        'Apto 301',
        'Junho/2026',
        820.00,
        '2026-06-15',
        'PAGO',
        '34191.79001 01043.510047 91020.150008 1 97890000082000',
        '00020126580014br.gov.bcb.pix0136condominio.tailson@pix.com.br5204000053039865405820.005802BR5919CONDOMINIO TAILSON6009SAO PAULO62070503***6304C3D4',
        $1::jsonb
      ),
      (
        'Apto 301',
        'Maio/2026',
        820.00,
        '2026-05-15',
        'PAGO',
        '34191.79001 01043.510047 91020.150008 1 97890000082000',
        '00020126580014br.gov.bcb.pix0136condominio.tailson@pix.com.br5204000053039865405820.005802BR5919CONDOMINIO TAILSON6009SAO PAULO62070503***6304E5F6',
        $1::jsonb
      ),
      (
        'Apto 402',
        'Julho/2026',
        910.00,
        (CURRENT_DATE + INTERVAL '5 days')::date,
        'PENDENTE',
        '34191.79001 01043.510047 91020.150008 1 97890000091000',
        '00020126580014br.gov.bcb.pix0136condominio.tailson@pix.com.br5204000053039865405910.005802BR5919CONDOMINIO TAILSON6009SAO PAULO62070503***6304G7H8',
        $1::jsonb
      )
    `, [itensPadrão]);
  }

  tabelaVerificada = true;
}

export async function listarBoletos(unidadeFiltro?: string, condominioId = 1) {
  await garantirTabelaFinanceiro();

  // Atualização dinâmica dos vencidos
  await pool.query(`
    UPDATE boletos_financeiro
    SET status = 'VENCIDO'
    WHERE status = 'PENDENTE' AND data_vencimento < CURRENT_DATE
  `);

  let query = `
    SELECT
      id,
      unidade,
      competencia,
      valor_num::float AS valor,
      TO_CHAR(data_vencimento, 'DD/MM/YYYY') AS data_vencimento,
      status,
      codigo_barras,
      pix_copia_cola,
      detalhamento
    FROM boletos_financeiro
    WHERE condominio_id = $1
  `;
  const params: unknown[] = [condominioId];

  if (unidadeFiltro && unidadeFiltro !== "TODOS" && unidadeFiltro !== "Administração (Apto 501)") {
    query += " AND unidade = $2";
    params.push(unidadeFiltro);
  }

  query += " ORDER BY id DESC";

  const res = await pool.query(query, params);
  return res.rows;
}

// Gera uma cobrança PIX real no Mercado Pago pro boleto e grava o código copia-e-cola +
// o id do pedido (usado depois pelo webhook pra achar o boleto certo). Se o gateway não
// estiver configurado (sem MERCADOPAGO_ACCESS_TOKEN), não inventa um PIX falso — deixa o
// campo vazio e quem chamou decide como avisar o usuário disso.
export async function gerarPixParaBoleto(
  boletoId: number,
  valor: number,
  emailPagador: string
): Promise<{ pixCopiaCola: string | null; erro?: string }> {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return { pixCopiaCola: null, erro: "Gateway de pagamento (Mercado Pago) não configurado." };
  }

  try {
    const cobranca = await criarCobrancaPix({
      valor,
      referenciaExterna: `boleto-${boletoId}`,
      emailPagador,
    });

    await pool.query(
      "UPDATE boletos_financeiro SET pix_copia_cola = $1, mercadopago_order_id = $2 WHERE id = $3",
      [cobranca.pixCopiaCola, cobranca.orderId, boletoId]
    );

    return { pixCopiaCola: cobranca.pixCopiaCola };
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.error(`Erro ao gerar PIX pro boleto ${boletoId}:`, msg);
    return { pixCopiaCola: null, erro: msg };
  }
}

// Usado pelo webhook do Mercado Pago — marca como PAGO o boleto vinculado ao pedido
// confirmado, sem depender de condominio_id (a busca já é pelo id único do pedido).
export async function marcarBoletoPagoPorOrderId(orderId: string): Promise<number | null> {
  const res = await pool.query(
    "UPDATE boletos_financeiro SET status = 'PAGO' WHERE mercadopago_order_id = $1 AND status != 'PAGO' RETURNING id",
    [orderId]
  );
  return res.rows[0]?.id ?? null;
}
