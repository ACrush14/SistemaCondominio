import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";
import { reativarUsuario } from "../../../../lib/store/usuariosDb";
import { registrarAuditoria } from "../../../../lib/auditoria";

// Soft-delete: nunca apaga o usuário de verdade — só marca status = 'INATIVO' (com
// auditoria de quando e quem desativou). Login e todos os fluxos de recuperação de
// senha já filtram por status = 'ATIVO', então uma conta desativada perde acesso
// imediatamente sem perder o histórico associado (ocorrências, reservas, etc.).
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const condominioId = obterCondominioId(req);
  const usuarioId = obterUsuarioId(req);
  const { id } = await params;
  const resultado = await pool.query(
    `UPDATE usuarios
     SET status = 'INATIVO', desativado_em = NOW(), desativado_por = $3
     WHERE id = $1 AND condominio_id = $2 AND status = 'ATIVO'
     RETURNING id`,
    [id, condominioId, usuarioId]
  );

  if (resultado.rowCount === 0) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  await registrarAuditoria({
    condominioId,
    usuarioId,
    acao: "DESATIVAR",
    entidade: "usuario",
    entidadeId: Number(id),
  });

  return NextResponse.json({ mensagem: `Usuário ${id} revogado com sucesso.` });
}

// Restauração de conta desativada por engano. Único uso hoje: body { acao: "reativar" }.
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

  const reativado = await reativarUsuario(Number(id), condominioId);
  if (!reativado) {
    return NextResponse.json({ erro: "Usuário não encontrado ou já está ativo." }, { status: 404 });
  }

  await registrarAuditoria({
    condominioId,
    usuarioId,
    acao: "REATIVAR",
    entidade: "usuario",
    entidadeId: Number(id),
  });

  return NextResponse.json({ mensagem: `Usuário ${id} reativado com sucesso.` });
}
