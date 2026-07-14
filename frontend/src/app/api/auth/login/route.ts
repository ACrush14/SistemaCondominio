import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../../../lib/store/db";

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();
    const emailLimpo = (email || "").trim().toLowerCase();

    const resultado = await pool.query(
      "SELECT id, nome, email, senha_hash, perfil, unidade, condominio_id FROM usuarios WHERE email = $1",
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

    // Todos os condomínios que este usuário pode acessar/alternar (não só o "principal").
    // Backfill garante que todo usuário tem pelo menos o próprio condominio_id aqui.
    const vinculos = await pool.query(
      "SELECT condominio_id FROM usuario_condominios WHERE usuario_id = $1 ORDER BY condominio_id",
      [usuario.id]
    );
    const condominiosPermitidos = vinculos.rows.map((r) => r.condominio_id);

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        unidade: usuario.unidade,
        condominio_id: usuario.condominio_id,
        condominios: condominiosPermitidos.length > 0 ? condominiosPermitidos : [usuario.condominio_id],
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
  } catch (erro: unknown) {
    console.error("Erro no login:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao processar login: " + msg }, { status: 500 });
  }
}
