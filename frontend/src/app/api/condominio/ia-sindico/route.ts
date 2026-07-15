import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { perguntarGemini } from "../../../../lib/gemini";
import { obterCondominioId, obterUsuarioId } from "../../../../lib/tenant";
import { registrarUsoIA, LIMITE_IA_DIARIO } from "../../../../lib/store/iaUsoDb";

async function montarContexto(condominioId: number): Promise<string> {
  const [ocorrencias, panico, encomendas] = await Promise.all([
    pool.query(
      `SELECT titulo, local, unidade, categoria, status
       FROM ocorrencias
       WHERE status != 'RESOLVIDO' AND condominio_id = $1
       ORDER BY criado_em DESC
       LIMIT 10`,
      [condominioId]
    ),
    pool.query(
      `SELECT tipo_emergencia, localizacao, observacao
       FROM alertas_panico
       WHERE status = 'ATIVO' AND condominio_id = $1
       ORDER BY criado_em DESC`,
      [condominioId]
    ),
    pool.query(
      `SELECT unidade, remetente, status
       FROM encomendas
       WHERE status != 'ENTREGUE' AND condominio_id = $1
       ORDER BY criado_em DESC
       LIMIT 10`,
      [condominioId]
    ),
  ]);

  const linhas: string[] = [];

  linhas.push(
    ocorrencias.rows.length
      ? `Ocorrências em aberto (${ocorrencias.rows.length}):\n` +
          ocorrencias.rows
            .map(
              (o) =>
                `- [${o.categoria}/${o.status}] ${o.titulo} (${o.local}, unidade ${o.unidade})`
            )
            .join("\n")
      : "Ocorrências em aberto: nenhuma."
  );

  linhas.push(
    panico.rows.length
      ? `Alertas de pânico ATIVOS agora (${panico.rows.length}):\n` +
          panico.rows
            .map((a) => `- ${a.tipo_emergencia} em ${a.localizacao} (${a.observacao || "sem observação"})`)
            .join("\n")
      : "Alertas de pânico: nenhum ativo no momento."
  );

  linhas.push(
    encomendas.rows.length
      ? `Encomendas aguardando retirada (${encomendas.rows.length}):\n` +
          encomendas.rows
            .map((e) => `- Unidade ${e.unidade}, remetente ${e.remetente} (${e.status})`)
            .join("\n")
      : "Encomendas pendentes: nenhuma."
  );

  return linhas.join("\n\n");
}

const INSTRUCAO = `Você é o Assistente Executivo IA do Síndico de um condomínio. Você recebe abaixo um resumo dos dados reais e atuais do sistema (ocorrências, alertas de pânico, encomendas) seguido de uma pergunta do síndico.

Responda em português, de forma objetiva e executiva (no máximo 4 frases curtas ou uma pequena lista), baseando-se SOMENTE nos dados fornecidos. Se os dados não tiverem informação suficiente para responder algo, diga isso claramente em vez de inventar. Priorize sempre alertas de pânico ativos como mais urgentes.`;

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const { pergunta } = await req.json();
    const texto = (pergunta || "").trim();
    if (!texto) {
      return NextResponse.json({ erro: "A pergunta é obrigatória." }, { status: 400 });
    }

    const uso = await registrarUsoIA(obterUsuarioId(req));
    if (!uso.permitido) {
      return NextResponse.json(
        { resposta_ia: `Você atingiu o limite diário de ${LIMITE_IA_DIARIO} perguntas para a IA. Tente novamente amanhã.` },
        { status: 200 }
      );
    }

    const contexto = await montarContexto(condominioId);
    const prompt = `Dados atuais do condomínio:\n\n${contexto}\n\nPergunta do síndico: ${texto}`;

    const resposta_ia = await perguntarGemini(prompt, INSTRUCAO);
    return NextResponse.json({ resposta_ia });
  } catch (erro: unknown) {
    console.error("Erro no Assistente Executivo IA (Gemini):", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao consultar a IA: " + msg }, { status: 500 });
  }
}
