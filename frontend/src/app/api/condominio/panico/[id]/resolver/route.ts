import { NextResponse } from "next/server";
import { pool } from "../../../../../../lib/store/db";
import { listarAlertasPanico, garantirTabelaPanico } from "../../../../../../lib/store/panicoDb";
import { obterCondominioId } from "../../../../../../lib/tenant";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelaPanico();
    const condominioId = obterCondominioId(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const resolvido_por = (body.resolvido_por || "Administração / Síndico").trim();

    const result = await pool.query(
      `UPDATE alertas_panico
       SET status = 'RESOLVIDO', resolvido_por = $1, resolvido_em = CURRENT_TIMESTAMP
       WHERE id = $2 AND condominio_id = $3
       RETURNING id`,
      [resolvido_por, id, condominioId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ erro: "Alerta não encontrado." }, { status: 404 });
    }

    const alertas = await listarAlertasPanico(condominioId);
    return NextResponse.json({ mensagem: "Alerta resolvido com sucesso!", alertas });
  } catch (erro: unknown) {
    console.error("Erro ao resolver pânico:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao resolver pânico: " + msg }, { status: 400 });
  }
}
