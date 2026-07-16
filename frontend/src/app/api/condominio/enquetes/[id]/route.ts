import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { garantirTabelasEnquetes, formatarEnquetes, excluirEnquete } from "../../../../../lib/store/enquetesDb";
import { obterCondominioId, obterUsuarioId } from "../../../../../lib/tenant";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelasEnquetes();
    const condominioId = obterCondominioId(req);
    const { id } = await params;
    const body = await req.json();

    if (body.status) {
      await pool.query(
        "UPDATE enquetes SET status = $1 WHERE id = $2 AND condominio_id = $3",
        [body.status, Number(id), condominioId]
      );
    }

    const lista = await formatarEnquetes(null, condominioId);
    const atualizada = lista.find((e) => Number(e.id) === Number(id));
    return NextResponse.json(atualizada || { sucesso: true });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao atualizar enquete." }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelasEnquetes();
    const condominioId = obterCondominioId(req);
    const usuarioId = obterUsuarioId(req);
    const { id } = await params;
    const excluida = await excluirEnquete(Number(id), condominioId, usuarioId);
    if (!excluida) {
      return NextResponse.json({ erro: "Enquete não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ sucesso: true });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao excluir enquete." }, { status: 400 });
  }
}
