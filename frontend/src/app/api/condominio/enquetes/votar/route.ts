import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { garantirTabelasEnquetes, formatarEnquetes } from "../../../../../lib/store/enquetesDb";

export async function POST(req: Request) {
  try {
    await garantirTabelasEnquetes();
    const body = await req.json();

    const { enquete_id, unidade, opcao_index } = body;

    if (enquete_id === undefined || !unidade || opcao_index === undefined) {
      return NextResponse.json(
        { erro: "Dados incompletos para registro do voto." },
        { status: 400 }
      );
    }

    // Verificar se enquete existe e está ativa
    const checkEnquete = await pool.query(
      "SELECT status FROM enquetes WHERE id = $1",
      [enquete_id]
    );

    if (checkEnquete.rows.length === 0) {
      return NextResponse.json({ erro: "Enquete não encontrada." }, { status: 404 });
    }

    if (checkEnquete.rows[0].status !== "ATIVA") {
      return NextResponse.json(
        { erro: "Esta enquete já foi encerrada para votação." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO enquete_votos (enquete_id, unidade, opcao_index, votado_em)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (enquete_id, unidade)
       DO UPDATE SET opcao_index = EXCLUDED.opcao_index, votado_em = CURRENT_TIMESTAMP`,
      [enquete_id, unidade, Number(opcao_index)]
    );

    const enquetesAtualizadas = await formatarEnquetes(unidade);
    return NextResponse.json(enquetesAtualizadas, { status: 200 });
  } catch (erro: unknown) {
    console.error("Erro na votação:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao registrar voto: " + msg }, { status: 400 });
  }
}
