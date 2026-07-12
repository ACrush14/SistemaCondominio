import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";

// DD/MM em vez de nome do mês: evita depender do locale (pt-BR) estar configurado no servidor Postgres.
const SELECT_BASE = `
  SELECT id, titulo, conteudo, publico, visualizacoes,
         TO_CHAR(criado_em, 'DD/MM') AS data
  FROM comunicados
`;

export async function GET() {
  const resultado = await pool.query(`${SELECT_BASE} ORDER BY criado_em DESC`);
  return NextResponse.json(resultado.rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resultado = await pool.query(
      `INSERT INTO comunicados (titulo, conteudo, publico)
       VALUES ($1, $2, $3)
       RETURNING id, titulo, conteudo, publico, visualizacoes,
                 TO_CHAR(criado_em, 'DD/MM') AS data`,
      [body.titulo, body.conteudo || "", body.publico || "Todos os moradores"]
    );
    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao publicar comunicado." }, { status: 400 });
  }
}
