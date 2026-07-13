import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../../../lib/store/db";

async function garantirUsuariosIniciais() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      perfil VARCHAR(50) DEFAULT 'MORADOR',
      unidade VARCHAR(100) DEFAULT '-',
      status VARCHAR(50) DEFAULT 'ATIVO',
      criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const check = await pool.query("SELECT COUNT(*) as total FROM usuarios");
  if (parseInt(check.rows[0].total, 10) === 0) {
    const hashSindico = await bcrypt.hash("admin123", 10);
    const hashPorteiro = await bcrypt.hash("porteiro123", 10);
    const hashMorador = await bcrypt.hash("morador123", 10);

    await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade) VALUES
       ($1, $2, $3, 'SINDICO', 'Administração (Apto 501)'),
       ($4, $5, $6, 'PORTEIRO', 'Portaria Principal'),
       ($7, $8, $9, 'MORADOR', 'Apto 301')
       ON CONFLICT (email) DO NOTHING`,
      [
        "Anderson de Lima",
        "anderson.sindico@condominio.com",
        hashSindico,
        "Fulano Porteiro",
        "fulano.porteiro@condominio.com",
        hashPorteiro,
        "João (Morador Tailson)",
        "joao@tailson.com",
        hashMorador,
      ]
    );
  }
}

export async function POST(req: Request) {
  try {
    await garantirUsuariosIniciais();
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
      process.env.JWT_SECRET || "condomanage-super-secret-jwt-key-2026",
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
