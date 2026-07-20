import { pool } from "./db";

let tabelaVerificada = false;

export async function garantirTabelaCondominios() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS condominios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      cnpj VARCHAR(30) DEFAULT '',
      endereco VARCHAR(200) DEFAULT '',
      total_unidades INTEGER DEFAULT 100,
      plano VARCHAR(50) DEFAULT 'EXECUTIVO_SAAS',
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const check = await pool.query("SELECT COUNT(*) as total FROM condominios");
  if (parseInt(check.rows[0].total, 10) === 0) {
    await pool.query(`
      INSERT INTO condominios (nome, slug, cnpj, endereco, total_unidades, plano) VALUES
      (
        'Condomínio Tailson Executive',
        'tailson-executive',
        '12.345.678/0001-90',
        'Av. das Américas, 1000 - Rio de Janeiro/RJ',
        120,
        'ENTERPRISE'
      ),
      (
        'Residencial Parque das Flores',
        'parque-flores',
        '98.765.432/0001-10',
        'Rua das Palmeiras, 450 - São Paulo/SP',
        80,
        'EXECUTIVO'
      ),
      (
        'Edifício Horizonte Corporate',
        'horizonte-corporate',
        '45.678.901/0001-22',
        'Av. Brigadeiro Faria Lima, 3000 - São Paulo/SP',
        200,
        'ENTERPRISE'
      )
    `);
  }

  tabelaVerificada = true;
}

export async function listarCondominios() {
  await garantirTabelaCondominios();
  const res = await pool.query(
    "SELECT id, nome, slug, cnpj, endereco, total_unidades, plano FROM condominios WHERE deletado_em IS NULL ORDER BY id ASC"
  );
  return res.rows;
}

// Versão enxuta pra rota pública de cadastro (sem sessão) — só o necessário pra
// escolher o prédio num formulário, sem vazar CNPJ/endereço pra quem não está logado.
export async function listarCondominiosPublico() {
  await garantirTabelaCondominios();
  const res = await pool.query("SELECT id, nome FROM condominios WHERE deletado_em IS NULL ORDER BY nome ASC");
  return res.rows;
}

export async function atualizarCondominio(
  id: number,
  dados: {
    nome?: string;
    slug?: string;
    cnpj?: string;
    endereco?: string;
    total_unidades?: number;
    plano?: string;
  }
) {
  await garantirTabelaCondominios();

  const atual = await pool.query("SELECT * FROM condominios WHERE id = $1 AND deletado_em IS NULL", [id]);
  if (atual.rows.length === 0) {
    throw new Error("Condomínio não encontrado.");
  }

  const base = atual.rows[0];
  const nome = dados.nome !== undefined ? dados.nome.trim() : base.nome;
  const slug =
    dados.slug !== undefined ? dados.slug.trim() : dados.nome ? dados.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-") : base.slug;
  const cnpj = dados.cnpj !== undefined ? dados.cnpj.trim() : base.cnpj;
  const endereco = dados.endereco !== undefined ? dados.endereco.trim() : base.endereco;
  const total_unidades = dados.total_unidades !== undefined ? Number(dados.total_unidades) : base.total_unidades;
  const plano = dados.plano !== undefined ? dados.plano.toUpperCase() : base.plano;

  const res = await pool.query(
    `UPDATE condominios
     SET nome = $1, slug = $2, cnpj = $3, endereco = $4, total_unidades = $5, plano = $6
     WHERE id = $7
     RETURNING id, nome, slug, cnpj, endereco, total_unidades, plano`,
    [nome, slug, cnpj, endereco, total_unidades, plano, id]
  );

  return res.rows[0];
}

// Soft-delete: nunca apaga o condomínio de verdade (o que já era bloqueado na prática
// pela FK sempre que havia usuários/dados vinculados) — só marca deletado_em/deletado_por
// e o prédio some dos catálogos. Idempotente.
export async function excluirCondominio(id: number, deletadoPor: number | null = null) {
  await garantirTabelaCondominios();

  if (id === 1) {
    throw new Error("Não é permitido excluir o condomínio principal/padrão do sistema (Tailson Executive).");
  }

  const res = await pool.query(
    "UPDATE condominios SET deletado_em = NOW(), deletado_por = $2 WHERE id = $1 AND deletado_em IS NULL RETURNING id",
    [id, deletadoPor]
  );
  if (res.rowCount === 0) {
    throw new Error("Condomínio não encontrado.");
  }

  return { sucesso: true };
}

// Lista condomínios excluídos (soft-delete) — só usado na tela de restauração.
export async function listarCondominiosExcluidos() {
  await garantirTabelaCondominios();
  const res = await pool.query(
    `SELECT id, nome, slug, TO_CHAR(deletado_em, 'DD/MM/YYYY HH24:MI') AS excluido_em
     FROM condominios WHERE deletado_em IS NOT NULL ORDER BY deletado_em DESC`
  );
  return res.rows;
}

// Restauração (idempotente): reaparece no catálogo com o slug original — por isso o
// índice único de slug é parcial (só entre os não-excluídos), então não há conflito
// mesmo que outro condomínio novo tenha reaproveitado o mesmo slug nesse meio-tempo...
// exceto se reaproveitou mesmo, caso em que o UPDATE abaixo falha com 23505 (tratado
// na rota) — cenário raro, mas honesto de reportar em vez de silenciar.
export async function restaurarCondominio(id: number) {
  await garantirTabelaCondominios();
  const res = await pool.query(
    "UPDATE condominios SET deletado_em = NULL, deletado_por = NULL WHERE id = $1 AND deletado_em IS NOT NULL RETURNING id",
    [id]
  );
  return (res.rowCount ?? 0) > 0;
}
