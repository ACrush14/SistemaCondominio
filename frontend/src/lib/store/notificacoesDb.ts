import { pool } from "./db";

let tabelaVerificada = false;

export async function garantirTabelaNotificacoes() {
  if (tabelaVerificada) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notificacoes_enviadas (
      id SERIAL PRIMARY KEY,
      destinatario_nome VARCHAR(150) NOT NULL,
      unidade VARCHAR(100) NOT NULL DEFAULT 'Apto 301',
      canal VARCHAR(50) NOT NULL, -- EMAIL, WHATSAPP, AMBOS
      contato VARCHAR(150) NOT NULL, -- Email ou telefone
      assunto VARCHAR(200) NOT NULL,
      mensagem TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ENVIADO',
      tipo_evento VARCHAR(100) NOT NULL DEFAULT 'AVISO',
      enviado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const check = await pool.query("SELECT COUNT(*) as total FROM notificacoes_enviadas");
  if (parseInt(check.rows[0].total, 10) === 0) {
    await pool.query(`
      INSERT INTO notificacoes_enviadas (
        destinatario_nome, unidade, canal, contato, assunto, mensagem, status, tipo_evento
      ) VALUES
      (
        'João (Morador Tailson)',
        'Apto 301',
        'WHATSAPP',
        '+55 (11) 98888-7777',
        '📦 Encomenda Recebida na Portaria',
        'Olá João! Sua encomenda (Mercado Livre) foi recebida na portaria. Código de retirada: #4928.',
        'ENVIADO',
        'ENCOMENDA'
      ),
      (
        'João (Morador Tailson)',
        'Apto 301',
        'EMAIL',
        'joao@tailson.com',
        '💳 Fatura Condominial Disponível',
        'Sua fatura de Julho/2026 no valor de R$ 850,00 está disponível na Área do Morador.',
        'ENVIADO',
        'FINANCEIRO'
      )
    `);
  }

  tabelaVerificada = true;
}

export async function listarNotificacoes(limite = 30) {
  await garantirTabelaNotificacoes();
  const res = await pool.query(
    `SELECT
      id,
      destinatario_nome,
      unidade,
      canal,
      contato,
      assunto,
      mensagem,
      status,
      tipo_evento,
      TO_CHAR(enviado_em AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') AS enviado_em
    FROM notificacoes_enviadas
    ORDER BY id DESC
    LIMIT $1`,
    [limite]
  );
  return res.rows;
}
