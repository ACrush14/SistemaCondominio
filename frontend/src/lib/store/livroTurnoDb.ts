import { pool } from "./db";

let tabelaVerificada = false;

export async function garantirTabelaLivroTurno() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS livro_turno_portaria (
      id SERIAL PRIMARY KEY,
      porteiro_nome VARCHAR(150) NOT NULL,
      turno VARCHAR(100) NOT NULL,
      assunto VARCHAR(150) NOT NULL,
      prioridade VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
      descricao TEXT NOT NULL,
      lido_por JSONB DEFAULT '[]'::jsonb,
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed inicial de teste se estiver vazio
  const check = await pool.query("SELECT COUNT(*) as total FROM livro_turno_portaria");
  if (parseInt(check.rows[0].total, 10) === 0) {
    await pool.query(`
      INSERT INTO livro_turno_portaria (porteiro_nome, turno, assunto, prioridade, descricao, lido_por)
      VALUES
      (
        'Fulano Porteiro',
        'TARDE (14h - 22h)',
        'PASSAGEM DE PLANTÃO',
        'IMPORTANTE',
        'Chave do salão de festas está com o Apto 201 (Mariana). Previsão de devolução amanhã pela manhã.',
        '["Fulano Porteiro"]'::jsonb
      ),
      (
        'Carlos Turno Noite',
        'NOITE (22h - 06h)',
        'AVISOS GERAIS',
        'URGENTE',
        'Portão da garagem apresentou lentidão ao fechar à 01:30. Técnico foi acionado pela manhã pelo Síndico.',
        '["Carlos Turno Noite", "Fulano Porteiro"]'::jsonb
      ),
      (
        'Fulano Porteiro',
        'MANHÃ (06h - 14h)',
        'ENCOMENDAS',
        'NORMAL',
        'Foram recebidos 4 pacotes grandes para a unidade Apto 301 no armário 2 da portaria.',
        '[]'::jsonb
      );
    `);
  }

  tabelaVerificada = true;
}

export async function listarLivroTurno(condominioId = 1) {
  await garantirTabelaLivroTurno();
  const res = await pool.query(
    `SELECT
      id,
      porteiro_nome,
      turno,
      assunto,
      prioridade,
      descricao,
      COALESCE(lido_por, '[]'::jsonb) AS lido_por,
      TO_CHAR(criado_em AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS criado_em
    FROM livro_turno_portaria
    WHERE condominio_id = $1
    ORDER BY id DESC`,
    [condominioId]
  );
  return res.rows;
}
