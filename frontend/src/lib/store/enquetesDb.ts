import { pool } from "./db";

let tabelasVerificadas = false;

export async function garantirTabelasEnquetes() {
  if (tabelasVerificadas) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquetes (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      opcoes JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'ATIVA',
      criada_por VARCHAR(100) DEFAULT 'Síndico',
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquete_votos (
      id SERIAL PRIMARY KEY,
      enquete_id INTEGER REFERENCES enquetes(id) ON DELETE CASCADE,
      unidade VARCHAR(100) NOT NULL,
      opcao_index INTEGER NOT NULL,
      votado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unq_enquete_unidade UNIQUE(enquete_id, unidade)
    );
  `);

  // Se não houver nenhuma enquete cadastrada, insere duas enquetes de exemplo
  const check = await pool.query("SELECT COUNT(*) as total FROM enquetes");
  if (parseInt(check.rows[0].total, 10) === 0) {
    const res1 = await pool.query(
      `INSERT INTO enquetes (titulo, descricao, opcoes, status, criada_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        "Reforma do Hall de Entrada Principal e Portaria",
        "Aprovação do orçamento para modernização do hall de entrada principal com iluminação LED e nova decoração.",
        JSON.stringify([
          "Aprovar Projeto Completo (R$ 15.000)",
          "Aprovar Apenas Iluminação LED (R$ 4.500)",
          "Não Aprovar no Momento"
        ]),
        "ATIVA",
        "Anderson de Lima (Síndico)"
      ]
    );

    const res2 = await pool.query(
      `INSERT INTO enquetes (titulo, descricao, opcoes, status, criada_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        "Horário de Funcionamento da Academia nos Fins de Semana",
        "Proposta para estender o horário de funcionamento da academia aos sábados e domingos das 20h para as 22h.",
        JSON.stringify([
          "Estender para 22:00h",
          "Manter horário atual (até 20:00h)"
        ]),
        "ATIVA",
        "Anderson de Lima (Síndico)"
      ]
    );

    const id1 = res1.rows[0].id;
    const id2 = res2.rows[0].id;

    await pool.query(
      `INSERT INTO enquete_votos (enquete_id, unidade, opcao_index) VALUES
       ($1, 'Apto 101', 0),
       ($1, 'Apto 102', 0),
       ($1, 'Apto 201', 1),
       ($1, 'Apto 402', 0),
       ($2, 'Apto 101', 0),
       ($2, 'Apto 202', 0),
       ($2, 'Apto 501', 1)
       ON CONFLICT DO NOTHING`,
      [id1, id2]
    );
  }

  tabelasVerificadas = true;
}

export async function formatarEnquetes(unidade?: string | null, condominioId = 1) {
  await garantirTabelasEnquetes();

  const enquetesRes = await pool.query(
    `SELECT id, titulo, descricao, opcoes, status, criada_por,
            TO_CHAR(criado_em, 'DD/MM/YYYY') AS data
     FROM enquetes
     WHERE condominio_id = $1 AND deletado_em IS NULL
     ORDER BY id DESC`,
    [condominioId]
  );

  const votosRes = await pool.query(
    `SELECT v.enquete_id, v.opcao_index, v.unidade
     FROM enquete_votos v
     JOIN enquetes e ON e.id = v.enquete_id
     WHERE e.condominio_id = $1`,
    [condominioId]
  );

  return enquetesRes.rows.map((e) => {
    let opcoes: string[] = [];
    if (typeof e.opcoes === "string") {
      try {
        opcoes = JSON.parse(e.opcoes);
      } catch {
        opcoes = [e.opcoes];
      }
    } else if (Array.isArray(e.opcoes)) {
      opcoes = e.opcoes;
    }

    const votosDestaEnquete = votosRes.rows.filter(
      (v) => Number(v.enquete_id) === Number(e.id)
    );

    const total_votos = votosDestaEnquete.length;
    const votos_por_opcao = opcoes.map((_, index) => {
      return votosDestaEnquete.filter((v) => Number(v.opcao_index) === index).length;
    });

    let meu_voto: number | null = null;
    if (unidade) {
      const v = votosDestaEnquete.find(
        (v) => v.unidade.toLowerCase() === unidade.toLowerCase()
      );
      if (v) meu_voto = Number(v.opcao_index);
    }

    return {
      id: e.id,
      titulo: e.titulo,
      descricao: e.descricao || "",
      opcoes,
      status: e.status,
      criada_por: e.criada_por || "Síndico",
      data: e.data,
      total_votos,
      votos_por_opcao,
      meu_voto,
    };
  });
}

// Soft-delete: nunca apaga a enquete de verdade (o que também apagaria os votos via
// ON DELETE CASCADE) — só marca deletado_em/deletado_por. Idempotente.
export async function excluirEnquete(
  id: number,
  condominioId: number,
  deletadoPor: number | null
): Promise<boolean> {
  const res = await pool.query(
    `UPDATE enquetes SET deletado_em = NOW(), deletado_por = $3
     WHERE id = $1 AND condominio_id = $2 AND deletado_em IS NULL
     RETURNING id`,
    [id, condominioId, deletadoPor]
  );
  return (res.rowCount ?? 0) > 0;
}
