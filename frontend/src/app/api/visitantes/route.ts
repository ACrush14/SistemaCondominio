import { NextResponse } from "next/server";
import { pool } from "../../../lib/store/db";
import { listarVisitantes, garantirTabelaVisitantes } from "../../../lib/store/visitantesDb";
import { obterCondominioId } from "../../../lib/tenant";

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const visitantes = await listarVisitantes(condominioId);
    return NextResponse.json(visitantes);
  } catch (erro: unknown) {
    console.error("Erro ao listar visitantes:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar visitantes: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaVisitantes();
    const condominioId = obterCondominioId(req);
    const body = await req.json();

    const nome = (body.nome || "Visitante Não Identificado").trim();
    const documento = (body.documento || "-").trim();
    const placa_veiculo = (body.placa_veiculo || "-").trim();
    const unidade_destino = (body.unidade_destino || "-").trim();

    const res = await pool.query(
      `INSERT INTO visitantes (nome, documento, placa_veiculo, unidade_destino, status, condominio_id)
       VALUES ($1, $2, $3, $4, 'ENTROU', $5)
       RETURNING id, nome, documento, placa_veiculo, unidade_destino, status`,
      [nome, documento, placa_veiculo, unidade_destino, condominioId]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (erro: unknown) {
    console.error("Erro ao registrar visitante:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao registrar visitante: " + msg }, { status: 400 });
  }
}
