-- Up Migration

-- Trilha de auditoria genérica: quem fez o quê, quando, em qualquer entidade sensível
-- (por enquanto usuarios, reservas, enquetes e condominios — as 4 que já têm soft-delete).
-- Deliberadamente simples (sem FK pra usuario_id, pra não travar se a conta for desativada
-- depois; sem FK pra entidade_id, já que "entidade" varia de tabela).
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  condominio_id INTEGER NOT NULL REFERENCES condominios(id),
  usuario_id INTEGER,
  usuario_nome VARCHAR(150),
  acao VARCHAR(20) NOT NULL,
  entidade VARCHAR(30) NOT NULL,
  entidade_id INTEGER NOT NULL,
  detalhes JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auditoria_condominio_idx ON auditoria (condominio_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS auditoria_entidade_idx ON auditoria (entidade, entidade_id);

-- Down Migration

DROP TABLE IF EXISTS auditoria;