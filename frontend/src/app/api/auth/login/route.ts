import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../../../lib/store/db";

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();
    const emailLimpo = (email || "").trim().toLowerCase();

    const resultado = await pool.query(
      "SELECT id, nome, email, senha_hash, perfil, unidade FROM usuarios WHERE email = $1",
      [emailLimpo]
    );
    const usuario = resultado.rows[0];

    if (!usuario) {
      return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
    }

    const senhaValida = await bcrypt.compare(senha || "", usuario.senha_hash);
    if (!senhaValida) {
      return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        unidade: usuario.unidade,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const resposta = NextResponse.json({
      mensagem: "Login realizado com sucesso!",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        unidade: usuario.unidade,
      },
    });

    resposta.cookies.set("sessao", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return resposta;
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao processar login." }, { status: 500 });
  }
}
