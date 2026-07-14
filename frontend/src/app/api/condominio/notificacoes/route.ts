import { NextResponse } from "next/server";
import { Resend } from "resend";
import twilio from "twilio";
import { pool } from "../../../../lib/store/db";
import { listarNotificacoes, contarNotificacoes, garantirTabelaNotificacoes } from "../../../../lib/store/notificacoesDb";
import { obterCondominioId } from "../../../../lib/tenant";

const resend = new Resend(process.env.RESEND_API_KEY);

function extrairEmail(contato: string): string | null {
  const match = contato.match(/[^\s|]+@[^\s|]+\.[^\s|]+/);
  return match ? match[0] : null;
}

function extrairTelefone(contato: string): string | null {
  const match = contato.match(/\+?\d[\d\s\-()]{8,}\d/);
  if (!match) return null;
  const limpo = match[0].replace(/[^\d+]/g, "");
  return limpo.startsWith("+") ? limpo : `+${limpo}`;
}

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const url = new URL(req.url);
    const limiteParam = parseInt(url.searchParams.get("limite") || "10", 10);
    const limite = isNaN(limiteParam) || limiteParam <= 0 ? 10 : Math.min(limiteParam, 100);

    let offset = 0;
    if (url.searchParams.has("offset")) {
      const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
      offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;
    } else if (url.searchParams.has("pagina") || url.searchParams.has("page")) {
      const paginaParam = parseInt(url.searchParams.get("pagina") || url.searchParams.get("page") || "1", 10);
      const pagina = isNaN(paginaParam) || paginaParam < 1 ? 1 : paginaParam;
      offset = (pagina - 1) * limite;
    }

    const log = await listarNotificacoes(limite, condominioId, offset);
    const total = await contarNotificacoes(condominioId);

    return NextResponse.json({
      notificacoes: log,
      total,
      offset,
      limite,
      paginas: Math.ceil(total / limite),
    });
  } catch (erro: unknown) {
    console.error("Erro ao listar notificações:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar notificações: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaNotificacoes();
    const condominioId = obterCondominioId(req);
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

    let emailSucesso = false;
    let emailDetalhe = "";
    let whatsappSucesso = false;
    let whatsappDetalhe = "";

    if (canal === "EMAIL" || canal === "AMBOS") {
      const emailDestino = extrairEmail(contato);
      if (!emailDestino) {
        emailSucesso = false;
        emailDetalhe = "Nenhum e-mail válido encontrado no campo de contato.";
      } else {
        const resultado = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: emailDestino,
          subject: assunto,
          html: `<p>${mensagem}</p>`,
        });
        if (resultado.error) {
          emailSucesso = false;
          emailDetalhe = resultado.error.message;
        } else {
          emailSucesso = true;
        }
      }
    }

    if (canal === "WHATSAPP" || canal === "AMBOS") {
      const telefoneDestino = extrairTelefone(contato);
      if (!telefoneDestino) {
        whatsappSucesso = false;
        whatsappDetalhe = "Nenhum número de telefone válido encontrado no campo de contato.";
      } else if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        whatsappSucesso = false;
        whatsappDetalhe = "Credenciais do Twilio WhatsApp (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) não configuradas no ambiente.";
      } else {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
          const fromNumber = process.env.TWILIO_PHONE_NUMBER!.startsWith("whatsapp:")
            ? process.env.TWILIO_PHONE_NUMBER!
            : `whatsapp:${process.env.TWILIO_PHONE_NUMBER!}`;
          const toNumber = telefoneDestino.startsWith("whatsapp:")
            ? telefoneDestino
            : `whatsapp:${telefoneDestino}`;

          await client.messages.create({
            from: fromNumber,
            to: toNumber,
            body: `${assunto}\n\n${mensagem}`,
          });
          whatsappSucesso = true;
        } catch (err: unknown) {
          whatsappSucesso = false;
          const msgErr = err instanceof Error ? err.message : String(err);
          whatsappDetalhe = `Erro Twilio: ${msgErr}`;
        }
      }
    }

    let status: "ENVIADO" | "FALHA" = "ENVIADO";
    let detalhe = "";

    if (canal === "EMAIL") {
      status = emailSucesso ? "ENVIADO" : "FALHA";
      detalhe = emailDetalhe;
    } else if (canal === "WHATSAPP") {
      status = whatsappSucesso ? "ENVIADO" : "FALHA";
      detalhe = whatsappDetalhe;
    } else {
      if (emailSucesso && whatsappSucesso) {
        status = "ENVIADO";
      } else if (!emailSucesso && !whatsappSucesso) {
        status = "FALHA";
        detalhe = `E-mail: ${emailDetalhe} | WhatsApp: ${whatsappDetalhe}`;
      } else {
        status = "ENVIADO";
        detalhe = !emailSucesso ? `E-mail falhou (${emailDetalhe})` : `WhatsApp falhou (${whatsappDetalhe})`;
      }
    }

    const insert = await pool.query(
      `INSERT INTO notificacoes_enviadas (
        destinatario_nome, unidade, canal, contato, assunto, mensagem, status, tipo_evento, condominio_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [destinatario_nome, unidade, canal, contato, assunto, mensagem, status, tipo_evento, condominioId]
    );

    const logAtualizado = await listarNotificacoes(10, condominioId, 0);
    const total = await contarNotificacoes(condominioId);
    return NextResponse.json(
      {
        sucesso: status === "ENVIADO",
        mensagem:
          status === "ENVIADO"
            ? (detalhe ? `Notificação enviada com ressalvas via ${canal} (${detalhe})!` : `Notificação enviada com sucesso via ${canal}!`)
            : `Falha ao notificar via ${canal}: ${detalhe}`,
        id_registro: insert.rows[0].id,
        notificacoes: logAtualizado,
        total,
      },
      { status: 201 }
    );
  } catch (erro: unknown) {
    console.error("Erro ao enviar notificação:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao enviar notificação: " + msg }, { status: 400 });
  }
}
