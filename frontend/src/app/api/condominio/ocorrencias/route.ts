import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { perguntarGemini } from "../../../../lib/gemini";
import { obterCondominioId } from "../../../../lib/tenant";

const INSTRUCAO_RESUMO = `Você é o assistente administrativo de um condomínio. Um morador relatou uma ocorrência.
Escreva um resumo profissional e objetivo em português, em no máximo 2 frases curtas, destacando o problema e uma sugestão de encaminhamento (ex: "requer inspeção do zelador", "notificar unidade responsável").
Não invente detalhes que não estejam no relato. Responda só com o resumo, sem introdução.`;

const SELECT_BASE = `
  SELECT id, titulo, local, unidade, morador, categoria, status, resumo_ia,
         TO_CHAR(criado_em, 'DD/MM/YYYY, HH24:MI') AS data
  FROM ocorrencias
`;

export async function GET(req: Request) {
  const condominioId = obterCondominioId(req);
  const { searchParams } = new URL(req.url);
  const unidade = searchParams.get("unidade");

  if (unidade) {
    const resultado = await pool.query(
      `${SELECT_BASE} WHERE condominio_id = $1 AND unidade = $2 ORDER BY criado_em DESC`,
      [condominioId, unidade]
    );
    return NextResponse.json(resultado.rows);
  }

  const resultado = await pool.query(
    `${SELECT_BASE} WHERE condominio_id = $1 ORDER BY criado_em DESC`,
    [condominioId]
  );
  return NextResponse.json(resultado.rows);
}

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const body = await req.json();

    let resumo = "Ocorrência registrada no sistema e encaminhada para análise do Síndico.";
    if (body.descricao) {
      try {
        resumo = await perguntarGemini(body.descricao, INSTRUCAO_RESUMO);
      } catch (erroGemini) {
        console.error("Erro ao gerar resumo com Gemini:", erroGemini);
        resumo = body.descricao;
      }
    }

    const resultado = await pool.query(
      `INSERT INTO ocorrencias (titulo, local, unidade, morador, categoria, resumo_ia, condominio_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, titulo, local, unidade, morador, categoria, status, resumo_ia,
                 TO_CHAR(criado_em, 'DD/MM/YYYY, HH24:MI') AS data`,
      [
        body.titulo || "Nova Ocorrência",
        body.local || "Condomínio",
        body.unidade || "-",
        body.morador || "Morador",
        body.categoria || "GERAL",
        resumo,
        condominioId,
      ]
    );
    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (_erro) {
    return NextResponse.json({ erro: "Erro ao cadastrar ocorrência" }, { status: 400 });
  }
}
