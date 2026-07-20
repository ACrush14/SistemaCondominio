import { pool } from "./db";

export interface UsuarioRow {
  id: number | string;
  nome: string;
  email: string;
  perfil: string;
  unidade: string;
  status: string;
}

export async function listarUsuarios(limite = 10, condominioId = 1, offset = 0): Promise<UsuarioRow[]> {
  const res = await pool.query(
    `SELECT id, nome, email, perfil, unidade, status
     FROM usuarios
     WHERE condominio_id = $1 AND status = 'ATIVO'
     ORDER BY id ASC
     LIMIT $2 OFFSET $3`,
    [condominioId, limite, offset]
  );
  return res.rows;
}

export async function contarUsuarios(condominioId = 1): Promise<number> {
  const res = await pool.query(
    "SELECT COUNT(*) as total FROM usuarios WHERE condominio_id = $1 AND status = 'ATIVO'",
    [condominioId]
  );
  return parseInt(res.rows[0].total, 10);
}

// Lista contas desativadas (soft-delete) — usado só na tela de restauração, nunca no
// login nem em listagens normais (essas continuam filtrando por status = 'ATIVO').
export async function listarUsuariosInativos(condominioId = 1): Promise<UsuarioRow[]> {
  const res = await pool.query(
    `SELECT id, nome, email, perfil, unidade, status
     FROM usuarios
     WHERE condominio_id = $1 AND status = 'INATIVO'
     ORDER BY desativado_em DESC`,
    [condominioId]
  );
  return res.rows;
}

// Reativação (idempotente): só afeta uma conta que esteja de fato INATIVA no mesmo
// condomínio. Limpa desativado_em/desativado_por, já que a conta volta a estar em uso.
export async function reativarUsuario(id: number, condominioId: number): Promise<{ id: number } | null> {
  const res = await pool.query(
    `UPDATE usuarios
     SET status = 'ATIVO', desativado_em = NULL, desativado_por = NULL
     WHERE id = $1 AND condominio_id = $2 AND status = 'INATIVO'
     RETURNING id`,
    [id, condominioId]
  );
  return res.rows[0] ?? null;
}
