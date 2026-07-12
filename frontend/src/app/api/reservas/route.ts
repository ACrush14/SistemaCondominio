import { NextResponse } from "next/server";
import { pool } from "../../../lib/store/db";

interface ReservaRow {
  id: number;
  area: string;
  data_reserva: string;
  horario_inicio: string;
  horario_fim: string;
  dia_inteiro: boolean;
  convidados: number;
  observacao: string | null;
  morador: string | null;
  status: string;
}

function comHorarioExibicao(r: ReservaRow) {
  return {
    ...r,
    horario: r.dia_inteiro
      ? `${r.horario_inicio} - Dia Inteiro (até 23:00)`
      : `${r.horario_inicio} - ${r.horario_fim}`,
  };
}

export async function GET() {
  const resultado = await pool.query<ReservaRow>(
    `SELECT id, area, TO_CHAR(data_reserva, 'YYYY-MM-DD') AS data_reserva,
            horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador, status
     FROM reservas
     ORDER BY data_reserva ASC, id ASC`
  );

  return NextResponse.json(resultado.rows.map(comHorarioExibicao));
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

    const fimFormatado = body.dia_inteiro ? "23:00" : body.horario_fim || "22:00";

    const resultado = await pool.query<ReservaRow>(
      `INSERT INTO reservas (area, data_reserva, horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, area, TO_CHAR(data_reserva, 'YYYY-MM-DD') AS data_reserva,
                 horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador, status`,
      [
        body.area,
        body.data_reserva,
        body.horario_inicio,
        fimFormatado,
        !!body.dia_inteiro,
        Number(body.convidados) || 0,
        body.observacao || "",
        "Beatriz Mendonça (Apto 101)",
      ]
    );

    return NextResponse.json(
      {
        mensagem: "Reserva salva com sucesso na base!",
        reserva: comHorarioExibicao(resultado.rows[0]),
      },
      { status: 201 }
    );
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao processar reserva." }, { status: 400 });
  }
}
