import { pool } from "./db";

// Limite bem folgado — só existe pra evitar abuso/estouro de cota paga na conta do
// Google, não é um controle de segurança. Compartilhado entre os 3 pontos de IA
// (resumo de ocorrências, IA Mania, Assistente Executivo), por usuário, por dia.
export const LIMITE_IA_DIARIO = 10;

let tabelaVerificada = false;

async function garantirTabelaIaUso() {
  if (tabelaVerificada) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ia_uso_diario (
      usuario_id INTEGER NOT NULL,
      dia DATE NOT NULL DEFAULT CURRENT_DATE,
      contagem INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (usuario_id, dia)
    );
  `);
  tabelaVerificada = true;
}

// Se o usuário não puder ser identificado (header ausente), falha aberta — permite a
// chamada em vez de travar o recurso todo por causa de um problema de identificação.
export async function registrarUsoIA(usuarioId: number | null): Promise<{ permitido: boolean; restante: number }> {
  if (!usuarioId) return { permitido: true, restante: LIMITE_IA_DIARIO };

  await garantirTabelaIaUso();

  const res = await pool.query<{ contagem: number }>(
    `INSERT INTO ia_uso_diario (usuario_id, dia, contagem)
     VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (usuario_id, dia) DO UPDATE SET contagem = ia_uso_diario.contagem + 1
     RETURNING contagem`,
    [usuarioId]
  );

  const contagem = res.rows[0].contagem;
  if (contagem > LIMITE_IA_DIARIO) {
    return { permitido: false, restante: 0 };
  }
  return { permitido: true, restante: LIMITE_IA_DIARIO - contagem };
}
