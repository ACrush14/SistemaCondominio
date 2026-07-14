import { pool } from "./db";

export interface OcorrenciaRow {
  id: number | string;
  titulo: string;
  local: string;
  unidade: string;
  morador: string;
  categoria: string;
  status: string;
  resumo_ia: string;
  data: string;
}

const SELECT_BASE = `
  SELECT id, titulo, local, unidade, morador, categoria, status, resumo_ia,
         TO_CHAR(criado_em, 'DD/MM/YYYY, HH24:MI') AS data
  FROM ocorrencias
`;

export async function listarOcorrencias(
  limite = 10,
  condominioId = 1,
  offset = 0,
  unidade?: string | null
): Promise<OcorrenciaRow[]> {
  if (unidade) {
    const res = await pool.query(
      `${SELECT_BASE} WHERE condominio_id = $1 AND unidade = $2 ORDER BY criado_em DESC LIMIT $3 OFFSET $4`,
      [condominioId, unidade, limite, offset]
    );
    return res.rows;
  }
  const res = await pool.query(
    `${SELECT_BASE} WHERE condominio_id = $1 ORDER BY criado_em DESC LIMIT $2 OFFSET $3`,
    [condominioId, limite, offset]
  );
  return res.rows;
}

export async function contarOcorrencias(condominioId = 1, unidade?: string | null): Promise<number> {
  if (unidade) {
    const res = await pool.query(
      "SELECT COUNT(*) as total FROM ocorrencias WHERE condominio_id = $1 AND unidade = $2",
      [condominioId, unidade]
    );
    return parseInt(res.rows[0].total, 10);
  }
  const res = await pool.query(
    "SELECT COUNT(*) as total FROM ocorrencias WHERE condominio_id = $1",
    [condominioId]
  );
  return parseInt(res.rows[0].total, 10);
}
