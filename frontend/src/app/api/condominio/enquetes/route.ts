import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { garantirTabelasEnquetes, formatarEnquetes, listarEnquetesExcluidas } from "../../../../lib/store/enquetesDb";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";
import { registrarAuditoria } from "../../../../lib/auditoria";

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const { searchParams } = new URL(req.url);
    const unidade = searchParams.get("unidade");

    if (searchParams.get("excluidas") === "true") {
      const excluidas = await listarEnquetesExcluidas(condominioId);
      return NextResponse.json(excluidas);
    }

    const lista = await formatarEnquetes(unidade, condominioId);
    return NextResponse.json(lista);
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao buscar enquetes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await garantirTabelasEnquetes();
    const condominioId = obterCondominioId(req);
    const body = await req.json();

    if (!body.titulo || !Array.isArray(body.opcoes) || body.opcoes.length < 2) {
      return NextResponse.json(
        { erro: "A enquete precisa de um título e no mínimo 2 opções de voto." },
        { status: 400 }
      );
    }

    const resultado = await pool.query(
      `INSERT INTO enquetes (titulo, descricao, opcoes, status, criada_por, condominio_id)
       VALUES ($1, $2, $3, 'ATIVA', $4, $5)
       RETURNING id`,
      [
        body.titulo,
        body.descricao || "",
        JSON.stringify(body.opcoes),
        body.criada_por || "Anderson de Lima (Síndico)",
        condominioId,
      ]
    );

    await registrarAuditoria({
      condominioId,
      usuarioId: obterUsuarioId(req),
      acao: "CRIAR",
      entidade: "enquete",
      entidadeId: resultado.rows[0].id,
      detalhes: { titulo: body.titulo },
    });

    const lista = await formatarEnquetes(null, condominioId);
    const criada = lista.find((e) => e.id === resultado.rows[0].id) || lista[0];
    return NextResponse.json(criada, { status: 201 });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao criar enquete." }, { status: 400 });
  }
}
