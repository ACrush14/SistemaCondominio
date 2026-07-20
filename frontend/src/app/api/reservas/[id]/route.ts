import { NextResponse } from "next/server";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";
import { cancelarReserva, reativarReserva } from "../../../../lib/store/reservasDb";
import { registrarAuditoria } from "../../../../lib/auditoria";

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

  await registrarAuditoria({
    condominioId,
    usuarioId,
    acao: "CANCELAR",
    entidade: "reserva",
    entidadeId: Number(id),
  });

  return NextResponse.json({ mensagem: `Reserva ${id} cancelada com sucesso.` });
}

// Restauração de reserva cancelada por engano. Único uso hoje: body { acao: "reativar" }.
// Pode falhar com 409 se o horário já tiver sido ocupado por outra reserva nesse meio-tempo.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const condominioId = obterCondominioId(req);
  const usuarioId = obterUsuarioId(req);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.acao !== "reativar") {
    return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
  }

  const resultado = await reativarReserva(Number(id), condominioId);
  if (!resultado) {
    return NextResponse.json({ erro: "Reserva não encontrada ou já está ativa." }, { status: 404 });
  }
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 409 });
  }

  await registrarAuditoria({
    condominioId,
    usuarioId,
    acao: "REATIVAR",
    entidade: "reserva",
    entidadeId: Number(id),
  });

  return NextResponse.json({ mensagem: `Reserva ${id} restaurada com sucesso.` });
}
