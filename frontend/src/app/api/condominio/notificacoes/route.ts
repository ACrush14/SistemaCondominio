import { NextResponse } from "next/server";
import { Resend } from "resend";
import { pool } from "../../../../lib/store/db";
import { listarNotificacoes, garantirTabelaNotificacoes } from "../../../../lib/store/notificacoesDb";

const resend = new Resend(process.env.RESEND_API_KEY);

function extrairEmail(contato: string): string | null {
  const match = contato.match(/[^\s|]+@[^\s|]+\.[^\s|]+/);
  return match ? match[0] : null;
}

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

    let status: "ENVIADO" | "FALHA" = "ENVIADO";
    let detalhe = "";

    if (canal === "EMAIL" || canal === "AMBOS") {
      const emailDestino = extrairEmail(contato);
      if (!emailDestino) {
        status = "FALHA";
        detalhe = "Nenhum e-mail válido encontrado no campo de contato.";
      } else {
        const resultado = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: emailDestino,
          subject: assunto,
          html: `<p>${mensagem}</p>`,
        });
        if (resultado.error) {
          status = "FALHA";
          detalhe = resultado.error.message;
        }
      }
    }

    // WhatsApp ainda não está integrado a nenhum provedor real (Twilio, etc.) — não finge sucesso.
    if (canal === "WHATSAPP" || (canal === "AMBOS" && status === "ENVIADO")) {
      if (canal === "WHATSAPP") {
        status = "FALHA";
      }
      detalhe = detalhe
        ? detalhe + " | WhatsApp ainda não foi integrado a um provedor real."
        : "WhatsApp ainda não foi integrado a um provedor real.";
    }

    const insert = await pool.query(
      `INSERT INTO notificacoes_enviadas (
        destinatario_nome, unidade, canal, contato, assunto, mensagem, status, tipo_evento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [destinatario_nome, unidade, canal, contato, assunto, mensagem, status, tipo_evento]
    );

    const logAtualizado = await listarNotificacoes();
    return NextResponse.json(
      {
        sucesso: status === "ENVIADO",
        mensagem:
          status === "ENVIADO"
            ? `Notificação enviada com sucesso via ${canal}!`
            : `Falha ao notificar via ${canal}: ${detalhe}`,
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
