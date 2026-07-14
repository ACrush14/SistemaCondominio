import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { obterCondominioId } from "../../../../lib/tenant";

// DD/MM em vez de nome do mês: evita depender do locale (pt-BR) estar configurado no servidor Postgres.
const SELECT_BASE = `
  SELECT id, titulo, conteudo, publico, visualizacoes,
         TO_CHAR(criado_em, 'DD/MM') AS data
  FROM comunicados
`;

export async function GET(req: Request) {
  const condominioId = obterCondominioId(req);
  const resultado = await pool.query(
    `${SELECT_BASE} WHERE condominio_id = $1 ORDER BY criado_em DESC`,
    [condominioId]
  );
  return NextResponse.json(resultado.rows);
}

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const body = await req.json();
    const resultado = await pool.query(
      `INSERT INTO comunicados (titulo, conteudo, publico, condominio_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, titulo, conteudo, publico, visualizacoes,
                 TO_CHAR(criado_em, 'DD/MM') AS data`,
      [body.titulo, body.conteudo || "", body.publico || "Todos os moradores", condominioId]
    );
    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao publicar comunicado." }, { status: 400 });
  }
}
