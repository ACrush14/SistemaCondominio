import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";

function gerarCodigo(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const codigo = gerarCodigo();
    const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const resultado = await pool.query(
      `INSERT INTO liberacoes_visita (codigo, nome_visitante, unidade, morador, expira_em)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING codigo, nome_visitante, unidade, morador, status, expira_em`,
      [codigo, body.nome_visitante || null, body.unidade, body.morador || null, expiraEm]
    );

    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao gerar liberação de visita." }, { status: 400 });
  }
}
