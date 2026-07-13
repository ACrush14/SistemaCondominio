import { NextResponse } from "next/server";
import { pool } from "../../../lib/store/db";
import { listarCondominios, garantirTabelaCondominios } from "../../../lib/store/condominiosDb";

export async function GET() {
  try {
    const lista = await listarCondominios();
    return NextResponse.json(lista);
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar condomínios: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelaCondominios();
    const body = await req.json();

    const nome = (body.nome || "").trim();
    const slug = (body.slug || nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim();
    const cnpj = (body.cnpj || "").trim();
    const endereco = (body.endereco || "").trim();
    const total_unidades = Number(body.total_unidades) || 100;
    const plano = (body.plano || "EXECUTIVO_SAAS").toUpperCase();

    if (!nome || !slug) {
      return NextResponse.json({ erro: "Nome e Slug são obrigatórios." }, { status: 400 });
    }

    const insert = await pool.query(
      `INSERT INTO condominios (nome, slug, cnpj, endereco, total_unidades, plano)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, slug`,
      [nome, slug, cnpj, endereco, total_unidades, plano]
    );

    const lista = await listarCondominios();
    return NextResponse.json(
      {
        sucesso: true,
        condominio: insert.rows[0],
        condominios: lista,
      },
      { status: 201 }
    );
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao criar condomínio: " + msg }, { status: 400 });
  }
}
