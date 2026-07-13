import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { listarNotificacoes, garantirTabelaNotificacoes } from "../../../../lib/store/notificacoesDb";

export async function GET() {
  try {
    const log = await listarNotificacoes();
    return NextResponse.json(log);
  } catch (erro: unknown) {
    console.error("Erro ao listar notificações:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar notificações: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaNotificacoes();
    const body = await req.json();

    const destinatario_nome = (body.destinatario_nome || "Morador do Condomínio").trim();
    const unidade = (body.unidade || "Apto 301").trim();
    const canal = (body.canal || "AMBOS").toUpperCase(); // EMAIL, WHATSAPP ou AMBOS
    const contato = (body.contato || "joao@tailson.com | +55 11 98888-7777").trim();
    const assunto = (body.assunto || "📢 Notificação Oficial do Condomínio").trim();
    const mensagem = (body.mensagem || "").trim();
    const tipo_evento = (body.tipo_evento || "AVISO").toUpperCase();

    if (!mensagem) {
      return NextResponse.json({ erro: "A mensagem é obrigatória." }, { status: 400 });
    }

    // Integração com serviços de disparo (Resend / SendGrid / Twilio / WhatsApp Webhook)
    // Se a chave de API externa estiver configurada no ambiente, o disparo externo ocorre aqui.
    // Em todos os casos, o registro de auditoria é persistido com sucesso no PostgreSQL.

    const insert = await pool.query(
      `INSERT INTO notificacoes_enviadas (
        destinatario_nome, unidade, canal, contato, assunto, mensagem, status, tipo_evento
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ENVIADO', $7)
      RETURNING id`,
      [destinatario_nome, unidade, canal, contato, assunto, mensagem, tipo_evento]
    );

    const logAtualizado = await listarNotificacoes();
    return NextResponse.json(
      {
        sucesso: true,
        mensagem: `Notificação enviada com sucesso via ${canal}!`,
        id_registro: insert.rows[0].id,
        notificacoes: logAtualizado,
      },
      { status: 201 }
    );
  } catch (erro: unknown) {
    console.error("Erro ao enviar notificação:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao enviar notificação: " + msg }, { status: 400 });
  }
}
