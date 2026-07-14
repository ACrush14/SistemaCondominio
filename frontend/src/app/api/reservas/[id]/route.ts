import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { obterCondominioId } from "../../../../lib/tenant";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const condominioId = obterCondominioId(req);
  const { id } = await params;
  const resultado = await pool.query(
    "DELETE FROM reservas WHERE id = $1 AND condominio_id = $2",
    [id, condominioId]
  );

  if (resultado.rowCount === 0) {
    return NextResponse.json({ erro: "Reserva não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ mensagem: `Reserva ${id} excluída com sucesso.` });
}
