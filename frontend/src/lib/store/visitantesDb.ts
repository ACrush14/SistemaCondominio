import { pool } from "./db";

let tabelaVerificada = false;

export async function garantirTabelaVisitantes() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitantes (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      documento VARCHAR(50) DEFAULT '-',
      placa_veiculo VARCHAR(50) DEFAULT '-',
      unidade_destino VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'ENTROU',
      data_entrada TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const check = await pool.query("SELECT COUNT(*) as total FROM visitantes");
  if (parseInt(check.rows[0].total, 10) === 0) {
    await pool.query(`
      INSERT INTO visitantes (nome, documento, placa_veiculo, unidade_destino, status)
      VALUES
        ('Carlos Eduardo Silva', '123.456.789-00', 'ABC-1234', 'Apto 301', 'ENTROU'),
        ('Entregador MercadoLivre', '987.654.321-99', 'XYZ-9988', 'Apto 501', 'ENTROU');
    `);
  }

  tabelaVerificada = true;
}

export async function listarVisitantes(condominioId = 1) {
  await garantirTabelaVisitantes();
  const res = await pool.query(
    `SELECT
      id,
      nome,
      documento,
      placa_veiculo,
      unidade_destino,
      status,
      TO_CHAR(data_entrada AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_entrada
    FROM visitantes
    WHERE condominio_id = $1
    ORDER BY id DESC`,
    [condominioId]
  );
  return res.rows;
}
