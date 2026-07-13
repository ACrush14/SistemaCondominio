import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../lib/store/db";

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

export async function GET() {
  await garantirUsuariosIniciais();
  const resultado = await pool.query(
    "SELECT id, nome, email, perfil, unidade, status FROM usuarios ORDER BY id ASC"
  );
  return NextResponse.json(resultado.rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const senhaHash = await bcrypt.hash(body.senha || "trocar123", 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, perfil, unidade, status`,
      [body.nome, body.email, senhaHash, body.perfil || "MORADOR", body.unidade || "-"]
    );

    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (erro: unknown) {
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Este email já está cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ erro: "Erro ao cadastrar usuário" }, { status: 400 });
  }
}
