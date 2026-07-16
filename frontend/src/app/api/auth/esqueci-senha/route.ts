import { NextResponse } from "next/server";
import { Resend } from "resend";
import { pool } from "../../../../lib/store/db";
import { gerarCodigoRecuperacao } from "../../../../lib/store/recuperacaoSenhaDb";

const resend = new Resend(process.env.RESEND_API_KEY);

// A mensagem de sucesso é sempre a mesma, exista ou não o e-mail cadastrado — evita que
// esta rota vire um jeito de descobrir quais e-mails têm conta no sistema.
const MENSAGEM_PADRAO =
  "Se este e-mail estiver cadastrado, enviamos um código de verificação de 6 dígitos. Confira sua caixa de entrada.";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const emailLimpo = (email || "").trim().toLowerCase();

    if (!emailLimpo) {
      return NextResponse.json({ erro: "Informe um e-mail." }, { status: 400 });
    }

    const usuario = await pool.query("SELECT id, nome, email FROM usuarios WHERE email = $1", [emailLimpo]);

    if (usuario.rowCount === 0) {
      return NextResponse.json({ sucesso: true, mensagem: MENSAGEM_PADRAO });
    }

    const { id, nome, email: emailReal } = usuario.rows[0];
    const codigo = await gerarCodigoRecuperacao(id);

    // codigo === null significa que um código recente ainda está dentro do cooldown —
    // não reenviamos e-mail, mas a resposta pro cliente continua a mesma de sempre.
    if (codigo) {
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: emailReal,
          subject: "Código de recuperação de senha — CondoManage",
          html: `<p>Olá, ${nome}.</p><p>Seu código de verificação é:</p><h2 style="letter-spacing:6px;font-size:32px">${codigo}</h2><p>Válido por 15 minutos. Se você não pediu essa recuperação, ignore este e-mail.</p>`,
        });
      } catch (erroEmail) {
        console.error("Erro ao enviar e-mail de recuperação:", erroEmail);
        // Não revela a falha pro cliente (mesma lógica anti-enumeração) — só loga pra depuração.
      }
    }

    return NextResponse.json({ sucesso: true, mensagem: MENSAGEM_PADRAO });
  } catch (erro: unknown) {
    console.error("Erro em esqueci-senha:", erro);
    return NextResponse.json({ erro: "Erro ao processar solicitação." }, { status: 500 });
  }
}
