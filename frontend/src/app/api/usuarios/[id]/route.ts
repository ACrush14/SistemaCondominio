import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";

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

  return NextResponse.json({ mensagem: `Usuário ${id} revogado com sucesso.` });
}
