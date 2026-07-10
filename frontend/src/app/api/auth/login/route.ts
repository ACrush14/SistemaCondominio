import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    const emailLimpo = (email || "").trim().toLowerCase();
    const senhaLimpa = (senha || "").trim();

    // Credencial Oficial do Morador João
    if (emailLimpo === "joao@tailson.com" && senhaLimpa === "joaodelas") {
      return NextResponse.json({
        mensagem: "Login realizado com sucesso como Morador!",
        token: "jwt-token-morador-joao-tailson-2026",
        usuario: {
          id: "100",
          nome: "João (Morador Tailson)",
          email: "joao@tailson.com",
          role: "MORADOR",
          perfil: "MORADOR",
          unidade: "Apto 301",
        },
      });
    }

    // Credencial Oficial do Síndico
    if (
      emailLimpo.includes("sindico") ||
      emailLimpo.includes("anderson") ||
      (emailLimpo === "admin@condominio.com" && senhaLimpa === "admin")
    ) {
      return NextResponse.json({
        mensagem: "Login realizado com sucesso como Síndico!",
        token: "jwt-token-sindico-anderson-2026",
        usuario: {
          id: "1",
          nome: "Anderson de Lima — Síndico",
          email: emailLimpo,
          role: "SINDICO",
          perfil: "SINDICO",
          unidade: "Administração (Apto 501)",
        },
      });
    }

    // Credencial Oficial do Porteiro
    if (emailLimpo.includes("porteiro") || emailLimpo.includes("fulano")) {
      return NextResponse.json({
        mensagem: "Login realizado com sucesso como Porteiro!",
        token: "jwt-token-porteiro-fulano-2026",
        usuario: {
          id: "2",
          nome: "Fulano Alterado — Porteiro",
          email: emailLimpo,
          role: "PORTEIRO",
          perfil: "PORTEIRO",
          unidade: "Portaria Principal",
        },
      });
    }

    // Para qualquer morador ou teste, se colocar joao@tailson.com mas errar a senha
    if (emailLimpo === "joao@tailson.com" && senhaLimpa !== "joaodelas") {
      return NextResponse.json(
        { erro: "Senha incorreta para joao@tailson.com" },
        { status: 401 }
      );
    }

    // Fallback amigável para permitir teste
    return NextResponse.json({
      mensagem: "Login efetuado com sucesso!",
      token: "jwt-token-demo-2026",
      usuario: {
        id: String(Date.now()),
        nome: emailLimpo.split("@")[0].toUpperCase(),
        email: emailLimpo,
        role: "MORADOR",
        perfil: "MORADOR",
        unidade: "Apto 101",
      },
    });
  } catch (_err) {
    return NextResponse.json(
      { erro: "Erro ao processar login." },
      { status: 500 }
    );
  }
}
