import { pool } from "./store/db";

export type AcaoAuditoria = "CRIAR" | "DESATIVAR" | "REATIVAR" | "CANCELAR" | "EXCLUIR" | "RESTAURAR" | "ATUALIZAR";
export type EntidadeAuditoria = "usuario" | "reserva" | "enquete" | "condominio";

// Registro de auditoria best-effort: nunca deve derrubar a operação principal se falhar
// (ex: tabela indisponível por algum motivo transitório) — por isso engole erro e só loga.
export async function registrarAuditoria(params: {
  condominioId: number;
  usuarioId: number | null;
  acao: AcaoAuditoria;
  entidade: EntidadeAuditoria;
  entidadeId: number;
  detalhes?: Record<string, unknown>;
}) {
  try {
    // Guarda o nome no momento do registro (não faz JOIN na hora de exibir depois) —
    // assim o histórico continua legível mesmo se a conta do autor for desativada.
    let usuarioNome: string | null = null;
    if (params.usuarioId) {
      const r = await pool.query("SELECT nome FROM usuarios WHERE id = $1", [params.usuarioId]);
      usuarioNome = r.rows[0]?.nome ?? null;
    }

    await pool.query(
      `INSERT INTO auditoria (condominio_id, usuario_id, usuario_nome, acao, entidade, entidade_id, detalhes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.condominioId,
        params.usuarioId,
        usuarioNome,
        params.acao,
        params.entidade,
        params.entidadeId,
        params.detalhes ? JSON.stringify(params.detalhes) : null,
      ]
    );
  } catch (erro) {
    console.error("Falha ao registrar auditoria (não bloqueante):", erro);
  }
}
