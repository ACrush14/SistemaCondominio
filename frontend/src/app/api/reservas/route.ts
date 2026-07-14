import { NextResponse } from "next/server";
import { pool } from "../../../lib/store/db";
import { obterCondominioId } from "../../../lib/tenant";
import { ReservaRow, comHorarioExibicao, listarReservas, contarReservas } from "../../../lib/store/reservasDb";

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const url = new URL(req.url);
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

    const log = await listarReservas(limite, condominioId, offset);
    const total = await contarReservas(condominioId);

    return NextResponse.json({
      reservas: log,
      registros: log,
      total,
      offset,
      limite,
      paginas: Math.ceil(total / limite),
    });
  } catch (erro: unknown) {
    console.error("Erro ao listar reservas:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar reservas: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
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
      `INSERT INTO reservas (area, data_reserva, horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador, condominio_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        condominioId,
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
