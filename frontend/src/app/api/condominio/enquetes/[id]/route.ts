import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { garantirTabelasEnquetes, formatarEnquetes } from "../../../../../lib/store/enquetesDb";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelasEnquetes();
    const { id } = await params;
    const body = await req.json();

    if (body.status) {
      await pool.query("UPDATE enquetes SET status = $1 WHERE id = $2", [
        body.status,
        Number(id),
      ]);
    }

    const lista = await formatarEnquetes();
    const atualizada = lista.find((e) => Number(e.id) === Number(id));
    return NextResponse.json(atualizada || { sucesso: true });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao atualizar enquete." }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelasEnquetes();
    const { id } = await params;
    await pool.query("DELETE FROM enquetes WHERE id = $1", [Number(id)]);
    return NextResponse.json({ sucesso: true });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao excluir enquete." }, { status: 400 });
  }
}
