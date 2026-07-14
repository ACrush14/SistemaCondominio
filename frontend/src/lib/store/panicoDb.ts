import { pool } from "./db";

let tabelaVerificada = false;

export async function garantirTabelaPanico() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alertas_panico (
      id SERIAL PRIMARY KEY,
      porteiro_nome VARCHAR(150) NOT NULL,
      tipo_emergencia VARCHAR(150) NOT NULL,
      localizacao VARCHAR(150) NOT NULL DEFAULT 'Portaria Principal',
      observacao TEXT DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
      resolvido_por VARCHAR(150) DEFAULT NULL,
      resolvido_em TIMESTAMPTZ DEFAULT NULL,
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  tabelaVerificada = true;
}

export async function listarAlertasPanico(condominioId = 1) {
  await garantirTabelaPanico();
  const res = await pool.query(
    `SELECT
      id,
      porteiro_nome,
      tipo_emergencia,
      localizacao,
      observacao,
      status,
      COALESCE(resolvido_por, '-') AS resolvido_por,
      TO_CHAR(criado_em AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') AS criado_em,
      TO_CHAR(resolvido_em AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') AS resolvido_em
    FROM alertas_panico
    WHERE condominio_id = $1
    ORDER BY
      CASE WHEN status = 'ATIVO' THEN 0 ELSE 1 END,
      id DESC
    LIMIT 20`,
    [condominioId]
  );
  return res.rows;
}
