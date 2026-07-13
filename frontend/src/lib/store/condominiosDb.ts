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
