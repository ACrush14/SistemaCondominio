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
     WHERE condominio_id = $1
     ORDER BY id ASC
     LIMIT $2 OFFSET $3`,
    [condominioId, limite, offset]
  );
  return res.rows;
}

export async function contarUsuarios(condominioId = 1): Promise<number> {
  const res = await pool.query(
    "SELECT COUNT(*) as total FROM usuarios WHERE condominio_id = $1",
    [condominioId]
  );
  return parseInt(res.rows[0].total, 10);
}
