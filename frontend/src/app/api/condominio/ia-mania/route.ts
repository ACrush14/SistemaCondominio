import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mensagem } = await req.json();
    const texto = (mensagem || "").trim();
    const lower = texto.toLowerCase();

    const querReservar =
      lower.includes("reservar") ||
      lower.includes("reserva") ||
      lower.includes("agendar") ||
      lower.includes("marcar");

    if (querReservar) {
      let area = "Salão de Festas";
      if (lower.includes("churrasqueira") || lower.includes("churrasco")) {
        area = "Churrasqueira";
      } else if (lower.includes("piscina")) {
        area = "Piscina";
      } else if (lower.includes("salão") || lower.includes("salao") || lower.includes("festa")) {
        area = "Salão de Festas";
      }

      let diaNum = 25;
      const matchDia = lower.match(/dia\s+(\d{1,2})/i);
      if (matchDia) {
        diaNum = parseInt(matchDia[1], 10);
      }
      const hoje = new Date();
      let mesNum = hoje.getMonth() + 1;
      let anoNum = hoje.getFullYear();
      if (diaNum < hoje.getDate()) {
        mesNum += 1;
        if (mesNum > 12) {
          mesNum = 1;
          anoNum += 1;
        }
      }
      const dataFormatada = `${anoNum}-${String(mesNum).padStart(2, "0")}-${String(diaNum).padStart(2, "0")}`;

      let hrInicio = "15:00";
      let hrFim = "20:00";
      const matchHorarios = lower.match(
        /das\s+(\d{1,2})(?:h|:00)?\s+(?:até|as|às|a)\s+(?:as|às)?\s*(\d{1,2})(?:h|:00)?/i
      );
      if (matchHorarios) {
        hrInicio = `${String(matchHorarios[1]).padStart(2, "0")}:00`;
        hrFim = `${String(matchHorarios[2]).padStart(2, "0")}:00`;
      }

      let convidados = 10;
      const matchPessoas = lower.match(/(?:para|com)?\s*(\d{1,3})\s*(?:pessoas|convidados|amigos)/i);
      if (matchPessoas) {
        convidados = parseInt(matchPessoas[1], 10);
      }

      let observacao = "";
      const idxPreciso = lower.indexOf("vou precisar");
      const idxPrecisa = lower.indexOf("preciso");
      const idxObs = lower.indexOf("observação");
      if (idxPreciso !== -1) {
        observacao = texto.substring(idxPreciso);
      } else if (idxPrecisa !== -1) {
        observacao = texto.substring(idxPrecisa);
      } else if (idxObs !== -1) {
        observacao = texto.substring(idxObs);
      } else {
        const frases = texto.split(/[.!?]/).map((f: string) => f.trim()).filter(Boolean);
        if (frases.length > 1) {
          observacao = frases.slice(1).join(". ");
        }
      }

      return NextResponse.json({
        resposta_mania: `Entendi perfeitamente o seu pedido! Preparei o pré-agendamento do **${area}** para o dia **${diaNum}**, das **${hrInicio} às ${hrFim}**, para **${convidados} pessoas**${
          observacao ? `, com a observação: *"__${observacao}__"*` : ""
        }. Deseja confirmar e salvar agora no banco de dados?`,
        reserva_intencao: true,
        dados_reserva: {
          area,
          data_reserva: dataFormatada,
          horario_inicio: hrInicio,
          horario_fim: hrFim,
          convidados,
          observacao: observacao || "Reserva agendada com a IA Mania",
        },
      });
    }

    let respostaGeral =
      "Olá! Eu sou a **Mania**, a sua inteligência artificial do condomínio. Você pode conversar comigo à vontade para tirar dúvidas, saber horários ou me pedir para agendar reservas (ex: *'Quero reservar para dia 25 das 15 até as 20 para 10 pessoas o salão de festas. vou precisar de cadeiras e mesas'*).";

    if (
      lower.includes("oi") ||
      lower.includes("olá") ||
      lower.includes("ola") ||
      lower.includes("tudo bem")
    ) {
      respostaGeral =
        "Olá! Que bom falar com você! Eu sou a **Mania**, a IA oficial do condomínio. Como posso ajudar no seu dia de hoje? Você pode me pedir para reservar áreas comuns ou consultar regras!";
    } else if (lower.includes("síndico") || lower.includes("sindico")) {
      respostaGeral =
        "O Síndico do nosso residencial é o **Anderson de Lima** (Apto 501 / Administração). Você pode enviar mensagens ou ocorrências diretamente para ele pelo painel!";
    } else if (lower.includes("porteiro") || lower.includes("portaria")) {
      respostaGeral =
        "A portaria principal é operada pelo **Fulano Alterado**. Você pode liberar visitantes ou entregas com QR Code em segundos!";
    }

    return NextResponse.json({
      resposta_mania: respostaGeral,
      reserva_intencao: false,
    });
  } catch (_err) {
    return NextResponse.json(
      { resposta_mania: "Olá! Sou a IA Mania. Como posso te ajudar com seu condomínio hoje?" },
      { status: 200 }
    );
  }
}
