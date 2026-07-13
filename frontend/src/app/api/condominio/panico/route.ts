import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { listarAlertasPanico, garantirTabelaPanico } from "../../../../lib/store/panicoDb";

export async function GET() {
  try {
    const alertas = await listarAlertasPanico();
    const ativos = alertas.filter((a) => a.status === "ATIVO");
    return NextResponse.json({ alertas, total_ativos: ativos.length });
  } catch (erro: unknown) {
    console.error("Erro ao listar alertas de pânico:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar alertas de pânico: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaPanico();
    const body = await req.json();

    const porteiro_nome = (body.porteiro_nome || "Porteiro Plantonista").trim();
    const tipo_emergencia = (body.tipo_emergencia || "🆘 ALERTA GERAL DE PÂNICO").trim();
    const localizacao = (body.localizacao || "Portaria Principal").trim();
    const observacao = (body.observacao || "").trim();

    const res = await pool.query(
      `INSERT INTO alertas_panico (porteiro_nome, tipo_emergencia, localizacao, observacao, status)
       VALUES ($1, $2, $3, $4, 'ATIVO')
       RETURNING id`,
      [porteiro_nome, tipo_emergencia, localizacao, observacao]
    );

    const alertas = await listarAlertasPanico();
    return NextResponse.json(
      { mensagem: "Alerta de Pânico acionado com sucesso!", alertas },
      { status: 201 }
    );
  } catch (erro: unknown) {
    console.error("Erro ao acionar pânico:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao acionar pânico: " + msg }, { status: 400 });
  }
}
