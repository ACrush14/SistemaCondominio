import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { listarBoletos, garantirTabelaFinanceiro, gerarPixParaBoleto } from "../../../../lib/store/financeiroDb";
import { obterCondominioId } from "../../../../lib/tenant";

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const { searchParams } = new URL(req.url);
    const unidade = searchParams.get("unidade") || undefined;
    const boletos = await listarBoletos(unidade, condominioId);
    return NextResponse.json(boletos);
  } catch (erro: unknown) {
    console.error("Erro ao listar boletos:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar boletos: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaFinanceiro();
    const condominioId = obterCondominioId(req);
    const body = await req.json();

    const unidade = (body.unidade || "Apto 301").trim();
    const competencia = (body.competencia || "Agosto/2026").trim();
    const valor_num = parseFloat(body.valor || "850.00");
    const data_vencimento = body.data_vencimento || "2026-08-15";
    const codigo_barras =
      body.codigo_barras || "34191.79001 01043.510047 91020.150008 1 97890000085000";
    const detalhamento = body.detalhamento || [
      { item: "Taxa Condominial Ordinária", valor: valor_num * 0.8 },
      { item: "Fundo de Reserva (10%)", valor: valor_num * 0.1 },
      { item: "Consumo Individual Água/Gás", valor: valor_num * 0.1 },
    ];

    const insert = await pool.query(
      `INSERT INTO boletos_financeiro (
        unidade, competencia, valor_num, data_vencimento, status,
        codigo_barras, pix_copia_cola, detalhamento, condominio_id
      ) VALUES ($1, $2, $3, $4, 'PENDENTE', $5, '', $6::jsonb, $7)
      RETURNING id`,
      [unidade, competencia, valor_num, data_vencimento, codigo_barras, JSON.stringify(detalhamento), condominioId]
    );

    const boletoId = insert.rows[0].id;

    // Gera a cobrança PIX real (Mercado Pago) pro boleto recém-criado. Busca o e-mail de
    // um morador real da unidade pra preencher o payer exigido pela API — se não achar
    // ninguém, usa um e-mail técnico do próprio condomínio (não afeta o recebimento, o
    // PIX sempre credita a conta configurada no Mercado Pago, o payer é só metadado).
    const morador = await pool.query(
      "SELECT email FROM usuarios WHERE unidade = $1 AND condominio_id = $2 AND perfil = 'MORADOR' LIMIT 1",
      [unidade, condominioId]
    );
    const emailPagador = morador.rows[0]?.email || `financeiro+condominio${condominioId}@condomanage.app`;

    const { erro: erroPix } = await gerarPixParaBoleto(boletoId, valor_num, emailPagador);

    const listaAtualizada = await listarBoletos(unidade, condominioId);
    return NextResponse.json(
      { boletos: listaAtualizada, avisoPix: erroPix || null },
      { status: 201 }
    );
  } catch (erro: unknown) {
    console.error("Erro ao criar boleto:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao criar boleto: " + msg }, { status: 400 });
  }
}
