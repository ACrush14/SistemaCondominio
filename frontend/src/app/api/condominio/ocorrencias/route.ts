import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { perguntarGemini } from "../../../../lib/gemini";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";
import { listarOcorrencias, contarOcorrencias } from "../../../../lib/store/ocorrenciasDb";
import { registrarUsoIA } from "../../../../lib/store/iaUsoDb";

const INSTRUCAO_RESUMO = `Você é o assistente administrativo de um condomínio. Um morador relatou uma ocorrência.
Escreva um resumo profissional e objetivo em português, em no máximo 2 frases curtas, destacando o problema e uma sugestão de encaminhamento (ex: "requer inspeção do zelador", "notificar unidade responsável").
Não invente detalhes que não estejam no relato. Responda só com o resumo, sem introdução.`;

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const url = new URL(req.url);
    const unidade = url.searchParams.get("unidade");

    const limiteParam = parseInt(url.searchParams.get("limite") || "10", 10);
    const limite = isNaN(limiteParam) || limiteParam <= 0 ? 10 : Math.min(limiteParam, 100);

    let offset = 0;
    if (url.searchParams.has("offset")) {
      const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
      offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;
    } else if (url.searchParams.has("pagina") || url.searchParams.has("page")) {
      const paginaParam = parseInt(url.searchParams.get("pagina") || url.searchParams.get("page") || "1", 10);
      const pagina = isNaN(paginaParam) || paginaParam < 1 ? 1 : paginaParam;
      offset = (pagina - 1) * limite;
    }

    const log = await listarOcorrencias(limite, condominioId, offset, unidade);
    const total = await contarOcorrencias(condominioId, unidade);

    return NextResponse.json({
      ocorrencias: log,
      registros: log,
      total,
      offset,
      limite,
      paginas: Math.ceil(total / limite),
    });
  } catch (erro: unknown) {
    console.error("Erro ao listar ocorrências:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar ocorrências: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const body = await req.json();

    let resumo = "Ocorrência registrada no sistema e encaminhada para análise do Síndico.";
    if (body.descricao) {
      const uso = await registrarUsoIA(obterUsuarioId(req));
      if (!uso.permitido) {
        // Limite diário de IA atingido — não bloqueia o cadastro da ocorrência,
        // só deixa de gerar o resumo e usa o texto original do morador.
        resumo = body.descricao;
      } else {
        try {
          resumo = await perguntarGemini(body.descricao, INSTRUCAO_RESUMO);
        } catch (erroGemini) {
          console.error("Erro ao gerar resumo com Gemini:", erroGemini);
          resumo = body.descricao;
        }
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
