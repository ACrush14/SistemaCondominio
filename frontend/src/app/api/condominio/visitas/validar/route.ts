import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";

export async function POST(req: Request) {
  const { codigo } = await req.json();

  const resultado = await pool.query(
    "SELECT * FROM liberacoes_visita WHERE codigo = $1",
    [(codigo || "").toUpperCase()]
  );
  const liberacao = resultado.rows[0];

  if (!liberacao) {
    return NextResponse.json({ erro: "Código inválido." }, { status: 404 });
  }

  if (liberacao.status === "USADO") {
    return NextResponse.json({ erro: "Este código já foi utilizado." }, { status: 409 });
  }

  if (new Date(liberacao.expira_em) < new Date()) {
    return NextResponse.json({ erro: "Este código expirou." }, { status: 410 });
  }

  await pool.query("UPDATE liberacoes_visita SET status = 'USADO' WHERE id = $1", [
    liberacao.id,
  ]);

  return NextResponse.json({
    mensagem: "Acesso liberado!",
    visitante: {
      nome_visitante: liberacao.nome_visitante,
      unidade: liberacao.unidade,
      morador: liberacao.morador,
    },
  });
}
