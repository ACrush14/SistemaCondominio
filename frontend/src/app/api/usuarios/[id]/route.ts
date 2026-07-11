import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resultado = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

  if (resultado.rowCount === 0) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ mensagem: `Usuário ${id} revogado com sucesso.` });
}
