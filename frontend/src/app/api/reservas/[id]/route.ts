import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resultado = await pool.query("DELETE FROM reservas WHERE id = $1", [id]);

  if (resultado.rowCount === 0) {
    return NextResponse.json({ erro: "Reserva não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ mensagem: `Reserva ${id} excluída com sucesso.` });
}
