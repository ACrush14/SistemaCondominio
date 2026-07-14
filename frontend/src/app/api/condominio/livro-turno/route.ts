import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { listarLivroTurno, garantirTabelaLivroTurno } from "../../../../lib/store/livroTurnoDb";
import { obterCondominioId } from "../../../../lib/tenant";

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const registros = await listarLivroTurno(condominioId);
    return NextResponse.json(registros);
  } catch (erro: unknown) {
    console.error("Erro ao listar livro de turno:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar livro de turno: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaLivroTurno();
    const condominioId = obterCondominioId(req);
    const body = await req.json();

    const porteiro_nome = (body.porteiro_nome || "Porteiro Plantonista").trim();
    const turno = (body.turno || "MANHÃ (06h - 14h)").trim();
    const assunto = (body.assunto || "PASSAGEM DE PLANTÃO").trim();
    const prioridade = (body.prioridade || "NORMAL").trim();
    const descricao = (body.descricao || "").trim();

    if (!descricao) {
      return NextResponse.json({ erro: "A descrição do turno é obrigatória." }, { status: 400 });
    }

    const insert = await pool.query(
      `INSERT INTO livro_turno_portaria (porteiro_nome, turno, assunto, prioridade, descricao, lido_por, condominio_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [porteiro_nome, turno, assunto, prioridade, descricao, JSON.stringify([porteiro_nome]), condominioId]
    );

    const registrosAtualizados = await listarLivroTurno(condominioId);
    return NextResponse.json(registrosAtualizados, { status: 201 });
  } catch (erro: unknown) {
    console.error("Erro ao registrar livro de turno:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao registrar livro de turno: " + msg }, { status: 400 });
  }
}
