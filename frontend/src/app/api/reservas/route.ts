import { NextResponse } from "next/server";

let reservasDB = [
  {
    id: "101",
    area: "Salão de Festas",
    data_reserva: "2026-10-12",
    horario: "14:00 - 22:00",
    horario_inicio: "14:00",
    horario_fim: "22:00",
    dia_inteiro: false,
    convidados: 35,
    observacao: "Festa de aniversário com música ambiente (caixa de som portátil).",
    morador: "Carlos Eduardo Prado (Apto 102)",
    status: "CONFIRMADO",
  },
  {
    id: "102",
    area: "Churrasqueira",
    data_reserva: "2026-10-14",
    horario: "10:00 - Dia Inteiro (23:00)",
    horario_inicio: "10:00",
    horario_fim: "23:00 (Dia Inteiro)",
    dia_inteiro: true,
    convidados: 15,
    observacao: "Confraternização familiar. Usar freezer extra da churrasqueira.",
    morador: "Mariana Vasconcelos (Apto 201)",
    status: "CONFIRMADO",
  },
  {
    id: "103",
    area: "Piscina",
    data_reserva: "2026-10-15",
    horario: "09:00 - 17:00",
    horario_inicio: "09:00",
    horario_fim: "17:00",
    dia_inteiro: false,
    convidados: 10,
    observacao: "Aniversário infantil na área da piscina com salvavidas particular.",
    morador: "Beatriz Mendonça (Apto 101)",
    status: "CONFIRMADO",
  },
];

export async function GET() {
  return NextResponse.json(reservasDB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Regra dos 30 dias
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAlvo = new Date(body.data_reserva + "T00:00:00");
    const diferencaDias = Math.ceil(
      (dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diferencaDias > 30) {
      return NextResponse.json(
        {
          erro:
            "O agendamento online é permitido para até 30 dias de antecedência. Para datas superiores a 30 dias, solicite autorização diretamente ao Síndico (Anderson de Lima).",
        },
        { status: 403 }
      );
    }

    const fimFormatado = body.dia_inteiro
      ? "23:00 (Dia Inteiro)"
      : body.horario_fim || "22:00";
    const horarioExibicao = body.dia_inteiro
      ? `${body.horario_inicio} - Dia Inteiro (até 23:00)`
      : `${body.horario_inicio} - ${fimFormatado}`;

    const novaReserva = {
      id: String(Date.now()),
      area: body.area,
      data_reserva: body.data_reserva,
      horario: horarioExibicao,
      horario_inicio: body.horario_inicio,
      horario_fim: fimFormatado,
      dia_inteiro: !!body.dia_inteiro,
      convidados: Number(body.convidados) || 0,
      observacao: body.observacao || "",
      morador: "Beatriz Mendonça (Apto 101)",
      status: "CONFIRMADO",
    };

    reservasDB.push(novaReserva);

    return NextResponse.json({
      mensagem: "Reserva salva com sucesso na base!",
      reserva: novaReserva,
    }, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao processar reserva." }, { status: 400 });
  }
}
