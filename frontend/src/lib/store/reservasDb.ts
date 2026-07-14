import { pool } from "./db";

export interface ReservaRow {
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

export function comHorarioExibicao(r: ReservaRow) {
  return {
    ...r,
    horario: r.dia_inteiro
      ? `${r.horario_inicio} - Dia Inteiro (até 23:00)`
      : `${r.horario_inicio} - ${r.horario_fim}`,
  };
}

export async function listarReservas(limite = 10, condominioId = 1, offset = 0): Promise<any[]> {
  const res = await pool.query<ReservaRow>(
    `SELECT id, area, TO_CHAR(data_reserva, 'YYYY-MM-DD') AS data_reserva,
            horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador, status
     FROM reservas
     WHERE condominio_id = $1
     ORDER BY data_reserva ASC, id ASC
     LIMIT $2 OFFSET $3`,
    [condominioId, limite, offset]
  );
  return res.rows.map(comHorarioExibicao);
}

export async function contarReservas(condominioId = 1): Promise<number> {
  const res = await pool.query(
    "SELECT COUNT(*) as total FROM reservas WHERE condominio_id = $1",
    [condominioId]
  );
  return parseInt(res.rows[0].total, 10);
}

export function calcularDiferencaDias(dataReserva: string, dataBase?: Date): number {
  const hoje = dataBase ? new Date(dataBase) : new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataAlvo = new Date(dataReserva + "T00:00:00");
  if (isNaN(dataAlvo.getTime())) return NaN;
  return Math.ceil((dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export async function verificarConflitoReserva(
  condominioId: number,
  area: string,
  dataReserva: string,
  horarioInicio: string,
  horarioFim: string,
  diaInteiro = false,
  reservaIdIgnorar?: number
): Promise<ReservaRow | null> {
  let query = `
    SELECT id, area, TO_CHAR(data_reserva, 'YYYY-MM-DD') AS data_reserva,
           horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador, status
    FROM reservas
    WHERE condominio_id = $1
      AND area = $2
      AND TO_CHAR(data_reserva, 'YYYY-MM-DD') = $3
      AND status NOT IN ('CANCELADA', 'CANCELADO', 'REJEITADO', 'REJEITADA')
      AND ($4 = true OR dia_inteiro = true OR (horario_inicio < $6 AND horario_fim > $5))
  `;
  const params: (number | string | boolean)[] = [
    condominioId,
    area,
    dataReserva,
    diaInteiro,
    horarioInicio,
    horarioFim,
  ];

  if (reservaIdIgnorar !== undefined) {
    params.push(reservaIdIgnorar);
    query += ` AND id != $${params.length}`;
  }

  query += ` LIMIT 1`;

  const res = await pool.query<ReservaRow>(query, params);
  return res.rows.length > 0 ? res.rows[0] : null;
}

