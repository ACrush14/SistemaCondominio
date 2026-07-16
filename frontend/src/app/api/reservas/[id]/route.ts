import { NextResponse } from "next/server";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";
import { cancelarReserva } from "../../../../lib/store/reservasDb";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const condominioId = obterCondominioId(req);
  const usuarioId = obterUsuarioId(req);
  const { id } = await params;

  // Soft-delete: nunca apaga a reserva de verdade, só marca como CANCELADA (com
  // auditoria de quem cancelou) — reaproveita o mesmo status que a checagem de
  // conflito de horário já tratava como "vago".
  const cancelada = await cancelarReserva(Number(id), condominioId, usuarioId);

  if (!cancelada) {
    return NextResponse.json({ erro: "Reserva não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ mensagem: `Reserva ${id} cancelada com sucesso.` });
}
