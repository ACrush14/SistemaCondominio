import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { garantirTabelasEnquetes, formatarEnquetes, excluirEnquete, restaurarEnquete } from "../../../../../lib/store/enquetesDb";
import { obterCondominioId, obterUsuarioId } from "../../../../../lib/tenant";
import { registrarAuditoria } from "../../../../../lib/auditoria";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await garantirTabelasEnquetes();
    const condominioId = obterCondominioId(req);
    const usuarioId = obterUsuarioId(req);
    const { id } = await params;
    const body = await req.json();

    if (body.acao === "restaurar") {
      const restaurada = await restaurarEnquete(Number(id), condominioId);
      if (!restaurada) {
        return NextResponse.json({ erro: "Enquete não encontrada ou já está ativa." }, { status: 404 });
      }
      await registrarAuditoria({
        condominioId,
        usuarioId,
        acao: "RESTAURAR",
        entidade: "enquete",
        entidadeId: Number(id),
      });
      const lista = await formatarEnquetes(null, condominioId);
      return NextResponse.json(lista.find((e) => Number(e.id) === Number(id)) || { sucesso: true });
    }

    if (body.status) {
      await pool.query(
        "UPDATE enquetes SET status = $1 WHERE id = $2 AND condominio_id = $3",
        [body.status, Number(id), condominioId]
      );
      await registrarAuditoria({
        condominioId,
        usuarioId,
        acao: "ATUALIZAR",
        entidade: "enquete",
        entidadeId: Number(id),
        detalhes: { status: body.status },
      });
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
    await registrarAuditoria({
      condominioId,
      usuarioId,
      acao: "EXCLUIR",
      entidade: "enquete",
      entidadeId: Number(id),
    });
    return NextResponse.json({ sucesso: true });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao excluir enquete." }, { status: 400 });
  }
}
