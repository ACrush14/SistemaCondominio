import { NextResponse } from "next/server";
import { perguntarGeminiJSON } from "../../../../lib/gemini";

interface RespostaMania {
  reserva_intencao: boolean;
  resposta_mania: string;
  dados_reserva?: {
    area: string;
    data_reserva: string;
    horario_inicio: string;
    horario_fim: string;
    convidados: number;
    observacao: string;
  };
}

const SCHEMA = {
  type: "object",
  properties: {
    reserva_intencao: { type: "boolean" },
    resposta_mania: { type: "string" },
    dados_reserva: {
      type: "object",
      properties: {
        area: { type: "string", enum: ["Salão de Festas", "Churrasqueira", "Piscina"] },
        data_reserva: { type: "string", description: "formato YYYY-MM-DD" },
        horario_inicio: { type: "string", description: "formato HH:MM" },
        horario_fim: { type: "string", description: "formato HH:MM" },
        convidados: { type: "number" },
        observacao: { type: "string" },
      },
      required: ["area", "data_reserva", "horario_inicio", "horario_fim", "convidados", "observacao"],
    },
  },
  required: ["reserva_intencao", "resposta_mania"],
};

function instrucaoSistema(): string {
  const hoje = new Date();
  const hojeISO = hoje.toISOString().split("T")[0];

  return `Você é a "Mania", assistente de IA de um condomínio residencial, conversando com moradores em português do Brasil, num tom simpático e prestativo.

Hoje é ${hojeISO}. Quando o morador mencionar uma data relativa (ex: "dia 25"), calcule a data completa (YYYY-MM-DD) considerando o mês/ano atual, avançando para o mês seguinte se o dia já tiver passado neste mês.

Fatos do condomínio que você conhece:
- O Síndico é Anderson de Lima (Administração, Apto 501).
- O Porteiro é Fulano Alterado (Portaria Principal).
- Piscina: terça a domingo, 06h às 22h (fechada às segundas para tratamento químico).
- Mudanças/içamentos: segunda a sexta 08h-17h, sábados 08h-12h, agendar com 48h de antecedência.
- Reservas de áreas comuns (Salão de Festas, Churrasqueira, Piscina) só podem ser feitas com até 30 dias de antecedência.

Se o morador pedir para reservar/agendar uma área comum, identifique isso (reserva_intencao: true) e preencha "dados_reserva" com os dados extraídos da mensagem (use valores razoáveis como padrão se algo não for mencionado: 10 convidados, 15:00 às 20:00). Em "resposta_mania", confirme de forma amigável o que você entendeu e pergunte se pode salvar a reserva.

Se for só uma pergunta ou conversa geral (não é pedido de reserva), responda normalmente em "resposta_mania" e deixe reserva_intencao como false (não inclua dados_reserva).`;
}

export async function POST(req: Request) {
  try {
    const { mensagem } = await req.json();
    const texto = (mensagem || "").trim();

    if (!texto) {
      return NextResponse.json({
        resposta_mania: "Olá! Sou a IA Mania. Como posso te ajudar com seu condomínio hoje?",
        reserva_intencao: false,
      });
    }

    const resultado = await perguntarGeminiJSON<RespostaMania>(
      texto,
      instrucaoSistema(),
      SCHEMA
    );

    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("Erro na IA Mania (Gemini):", erro);
    return NextResponse.json(
      { resposta_mania: "Olá! Sou a IA Mania. Como posso te ajudar com seu condomínio hoje?", reserva_intencao: false },
      { status: 200 }
    );
  }
}
