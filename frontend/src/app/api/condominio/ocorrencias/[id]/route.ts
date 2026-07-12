import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const resultado = await pool.query(
    `UPDATE ocorrencias SET status = COALESCE($1, status) WHERE id = $2
     RETURNING id, titulo, local, unidade, morador, categoria, status, resumo_ia,
               TO_CHAR(criado_em, 'DD/MM/YYYY, HH24:MI') AS data`,
    [body.status ?? null, id]
  );

  if (resultado.rowCount === 0) {
    return NextResponse.json({ erro: "Ocorrência não encontrada." }, { status: 404 });
  }

  return NextResponse.json(resultado.rows[0]);
}
