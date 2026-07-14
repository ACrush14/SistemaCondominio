import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { obterCondominioId } from "../../../../../lib/tenant";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const condominioId = obterCondominioId(req);
  const { id } = await params;
  const body = await req.json();

  const resultado = await pool.query(
    `UPDATE encomendas SET status = COALESCE($1, status) WHERE id = $2 AND condominio_id = $3
     RETURNING id, unidade, morador, codigo, remetente, status,
               TO_CHAR(criado_em, 'DD/MM, HH24:MI') AS data_chegada`,
    [body.status ?? null, id, condominioId]
  );

  if (resultado.rowCount === 0) {
    return NextResponse.json({ erro: "Encomenda não encontrada." }, { status: 404 });
  }

  return NextResponse.json(resultado.rows[0]);
}
