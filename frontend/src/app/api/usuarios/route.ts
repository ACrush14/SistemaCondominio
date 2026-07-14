import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../lib/store/db";
import { obterCondominioId } from "../../../lib/tenant";

export async function GET(req: Request) {
  const condominioId = obterCondominioId(req);
  const resultado = await pool.query(
    "SELECT id, nome, email, perfil, unidade, status FROM usuarios WHERE condominio_id = $1 ORDER BY id ASC",
    [condominioId]
  );
  return NextResponse.json(resultado.rows);
}

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const body = await req.json();
    const senhaHash = await bcrypt.hash(body.senha || "trocar123", 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade, condominio_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, perfil, unidade, status`,
      [body.nome, body.email, senhaHash, body.perfil || "MORADOR", body.unidade || "-", condominioId]
    );

    // Todo usuário precisa de pelo menos um vínculo em usuario_condominios (o próprio
    // condominio_id) — sem isso o JWT emitido no login dele ficaria com a lista vazia.
    await pool.query(
      `INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [resultado.rows[0].id, condominioId]
    );

    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (erro: unknown) {
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Este email já está cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ erro: "Erro ao cadastrar usuário" }, { status: 400 });
  }
}
