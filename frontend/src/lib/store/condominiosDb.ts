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
    "SELECT id, nome, slug, cnpj, endereco, total_unidades, plano FROM condominios ORDER BY id ASC"
  );
  return res.rows;
}

// Versão enxuta pra rota pública de cadastro (sem sessão) — só o necessário pra
// escolher o prédio num formulário, sem vazar CNPJ/endereço pra quem não está logado.
export async function listarCondominiosPublico() {
  await garantirTabelaCondominios();
  const res = await pool.query("SELECT id, nome FROM condominios ORDER BY nome ASC");
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

  const atual = await pool.query("SELECT * FROM condominios WHERE id = $1", [id]);
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

export async function excluirCondominio(id: number) {
  await garantirTabelaCondominios();

  if (id === 1) {
    throw new Error("Não é permitido excluir o condomínio principal/padrão do sistema (Tailson Executive).");
  }

  const check = await pool.query("SELECT id FROM condominios WHERE id = $1", [id]);
  if (check.rows.length === 0) {
    throw new Error("Condomínio não encontrado.");
  }

  await pool.query("DELETE FROM condominios WHERE id = $1", [id]);
  return { sucesso: true };
}
