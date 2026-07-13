import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { listarBoletos, garantirTabelaFinanceiro } from "../../../../lib/store/financeiroDb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unidade = searchParams.get("unidade") || undefined;
    const boletos = await listarBoletos(unidade);
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
    const body = await req.json();

    const unidade = (body.unidade || "Apto 301").trim();
    const competencia = (body.competencia || "Agosto/2026").trim();
    const valor_num = parseFloat(body.valor || "850.00");
    const data_vencimento = body.data_vencimento || "2026-08-15";
    const codigo_barras =
      body.codigo_barras || "34191.79001 01043.510047 91020.150008 1 97890000085000";
    const pix_copia_cola =
      body.pix_copia_cola ||
      "00020126580014br.gov.bcb.pix0136condominio.tailson@pix.com.br5204000053039865405850.005802BR5919CONDOMINIO TAILSON6009SAO PAULO62070503***6304A1B2";
    const detalhamento = body.detalhamento || [
      { item: "Taxa Condominial Ordinária", valor: valor_num * 0.8 },
      { item: "Fundo de Reserva (10%)", valor: valor_num * 0.1 },
      { item: "Consumo Individual Água/Gás", valor: valor_num * 0.1 },
    ];

    const insert = await pool.query(
      `INSERT INTO boletos_financeiro (
        unidade, competencia, valor_num, data_vencimento, status,
        codigo_barras, pix_copia_cola, detalhamento
      ) VALUES ($1, $2, $3, $4, 'PENDENTE', $5, $6, $7::jsonb)
      RETURNING id`,
      [
        unidade,
        competencia,
        valor_num,
        data_vencimento,
        codigo_barras,
        pix_copia_cola,
        JSON.stringify(detalhamento),
      ]
    );

    const listaAtualizada = await listarBoletos(unidade);
    return NextResponse.json(listaAtualizada, { status: 201 });
  } catch (erro: unknown) {
    console.error("Erro ao criar boleto:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao criar boleto: " + msg }, { status: 400 });
  }
}
