import { pool } from "./db";

let tabelaVerificada = false;

async function garantirTabela() {
  if (tabelaVerificada) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codigos_recuperacao_senha (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      codigo VARCHAR(6) NOT NULL,
      expira_em TIMESTAMPTZ NOT NULL,
      usado BOOLEAN NOT NULL DEFAULT FALSE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  tabelaVerificada = true;
}

const VALIDADE_MINUTOS = 15;
const COOLDOWN_SEGUNDOS = 60;

function gerarCodigo(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

// Retorna null se um código recente ainda está "fresco" (evita reenvio de e-mail em
// spam) — nesse caso o chamador não deve gerar um novo código nem mandar outro e-mail,
// mas a resposta pro cliente continua a mesma de sempre (anti-enumeração de contas).
export async function gerarCodigoRecuperacao(usuarioId: number): Promise<string | null> {
  await garantirTabela();

  const recente = await pool.query(
    `SELECT id FROM codigos_recuperacao_senha
     WHERE usuario_id = $1 AND usado = false AND criado_em > NOW() - INTERVAL '${COOLDOWN_SEGUNDOS} seconds'
     LIMIT 1`,
    [usuarioId]
  );
  if ((recente.rowCount ?? 0) > 0) return null;

  // Invalida qualquer código anterior ainda não usado — só o mais recente vale.
  await pool.query(
    `UPDATE codigos_recuperacao_senha SET usado = true WHERE usuario_id = $1 AND usado = false`,
    [usuarioId]
  );

  const codigo = gerarCodigo();
  await pool.query(
    `INSERT INTO codigos_recuperacao_senha (usuario_id, codigo, expira_em)
     VALUES ($1, $2, NOW() + INTERVAL '${VALIDADE_MINUTOS} minutes')`,
    [usuarioId, codigo]
  );

  return codigo;
}

// Marca o código como usado atomicamente (UPDATE ... RETURNING) só se ele ainda for
// válido — não usado antes e dentro da validade, comparado direto no Postgres (NOW())
// pra não sofrer do bug de fuso horário de comparar TIMESTAMPTZ em JS.
export async function validarEConsumirCodigo(usuarioId: number, codigo: string): Promise<boolean> {
  await garantirTabela();

  const resultado = await pool.query(
    `UPDATE codigos_recuperacao_senha
     SET usado = true
     WHERE usuario_id = $1 AND codigo = $2 AND usado = false AND expira_em > NOW()
     RETURNING id`,
    [usuarioId, codigo]
  );

  return (resultado.rowCount ?? 0) > 0;
}
