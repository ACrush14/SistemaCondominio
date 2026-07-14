import { NextResponse } from "next/server";
import { pool } from "../../../../../../lib/store/db";
import { listarLivroTurno, garantirTabelaLivroTurno } from "../../../../../../lib/store/livroTurnoDb";
import { obterCondominioId } from "../../../../../../lib/tenant";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelaLivroTurno();
    const condominioId = obterCondominioId(req);
    const { id } = await params;
    const { porteiro_nome } = await req.json();

    const nome = (porteiro_nome || "Porteiro Plantonista").trim();

    const result = await pool.query(
      "SELECT lido_por FROM livro_turno_portaria WHERE id = $1 AND condominio_id = $2",
      [id, condominioId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
    }

    const lidoPorAtual: string[] = Array.isArray(result.rows[0].lido_por)
      ? result.rows[0].lido_por
      : [];

    if (!lidoPorAtual.includes(nome)) {
      lidoPorAtual.push(nome);
      await pool.query(
        "UPDATE livro_turno_portaria SET lido_por = $1::jsonb WHERE id = $2 AND condominio_id = $3",
        [JSON.stringify(lidoPorAtual), id, condominioId]
      );
    }

    const registrosAtualizados = await listarLivroTurno(condominioId);
    return NextResponse.json(registrosAtualizados);
  } catch (erro: unknown) {
    console.error("Erro ao registrar ciente:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao registrar ciente: " + msg }, { status: 400 });
  }
}
