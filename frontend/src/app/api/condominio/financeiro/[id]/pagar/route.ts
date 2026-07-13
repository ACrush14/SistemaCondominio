import { NextResponse } from "next/server";
import { pool } from "../../../../../../lib/store/db";
import { listarBoletos, garantirTabelaFinanceiro } from "../../../../../../lib/store/financeiroDb";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelaFinanceiro();
    const { id } = await params;

    const result = await pool.query(
      "UPDATE boletos_financeiro SET status = 'PAGO' WHERE id = $1 RETURNING id, unidade",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ erro: "Boleto não encontrado." }, { status: 404 });
    }

    const unidade = result.rows[0].unidade;
    const listaAtualizada = await listarBoletos(unidade);
    return NextResponse.json(listaAtualizada);
  } catch (erro: unknown) {
    console.error("Erro ao pagar boleto:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao pagar boleto: " + msg }, { status: 400 });
  }
}
