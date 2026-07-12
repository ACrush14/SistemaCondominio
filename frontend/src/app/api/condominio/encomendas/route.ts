import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";

const SELECT_BASE = `
  SELECT id, unidade, morador, codigo, remetente, status,
         TO_CHAR(criado_em, 'DD/MM, HH24:MI') AS data_chegada
  FROM encomendas
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unidade = searchParams.get("unidade");

  if (unidade) {
    const resultado = await pool.query(
      `${SELECT_BASE} WHERE unidade = $1 ORDER BY criado_em DESC`,
      [unidade]
    );
    return NextResponse.json(resultado.rows);
  }

  const resultado = await pool.query(`${SELECT_BASE} ORDER BY criado_em DESC`);
  return NextResponse.json(resultado.rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resultado = await pool.query(
      `INSERT INTO encomendas (unidade, morador, codigo, remetente)
       VALUES ($1, $2, $3, $4)
       RETURNING id, unidade, morador, codigo, remetente, status,
                 TO_CHAR(criado_em, 'DD/MM, HH24:MI') AS data_chegada`,
      [
        body.unidade || "-",
        body.morador || "Morador",
        body.codigo || "-",
        body.remetente || "Transportadora",
      ]
    );
    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao registrar encomenda" }, { status: 400 });
  }
}
