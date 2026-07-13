import { pool } from "./db";

let tabelaVerificada = false;

export async function garantirTabelaFinanceiro() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS boletos_financeiro (
      id SERIAL PRIMARY KEY,
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

export async function listarBoletos(unidadeFiltro?: string) {
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
  `;
  const params: unknown[] = [];

  if (unidadeFiltro && unidadeFiltro !== "TODOS" && unidadeFiltro !== "Administração (Apto 501)") {
    query += " WHERE unidade = $1";
    params.push(unidadeFiltro);
  }

  query += " ORDER BY id DESC";

  const res = await pool.query(query, params);
  return res.rows;
}
