import { pool } from "./db";

// Status que representam uma reserva "morta" (cancelada/rejeitada) — não deve aparecer
// em listagens nem contar como ocupando horário. Centralizado aqui pra não duplicar a
// lista em toda query que precisa excluir essas reservas.
export const STATUS_RESERVA_INATIVOS = ["CANCELADA", "CANCELADO", "REJEITADO", "REJEITADA"];

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
     WHERE condominio_id = $1 AND status <> ALL($4::text[])
     ORDER BY data_reserva ASC, id ASC
     LIMIT $2 OFFSET $3`,
    [condominioId, limite, offset, STATUS_RESERVA_INATIVOS]
  );
  return res.rows.map(comHorarioExibicao);
}

export async function contarReservas(condominioId = 1): Promise<number> {
  const res = await pool.query(
    "SELECT COUNT(*) as total FROM reservas WHERE condominio_id = $1 AND status <> ALL($2::text[])",
    [condominioId, STATUS_RESERVA_INATIVOS]
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
      AND status <> ALL($7::text[])
      AND ($4 = true OR dia_inteiro = true OR (horario_inicio < $6 AND horario_fim > $5))
  `;
  const params: (number | string | boolean | string[])[] = [
    condominioId,
    area,
    dataReserva,
    diaInteiro,
    horarioInicio,
    horarioFim,
    STATUS_RESERVA_INATIVOS,
  ];

  if (reservaIdIgnorar !== undefined) {
    params.push(reservaIdIgnorar);
    query += ` AND id != $${params.length}`;
  }

  query += ` LIMIT 1`;

  const res = await pool.query<ReservaRow>(query, params);
  return res.rows.length > 0 ? res.rows[0] : null;
}

// Cancelamento (soft-delete) de uma reserva — nunca apaga a linha de verdade, só marca
// status = CANCELADA com auditoria de quando e quem cancelou. Idempotente: cancelar de
// novo uma reserva já cancelada não faz nada (retorna null).
// Lista reservas canceladas (soft-delete) — só usado na tela de restauração.
export async function listarReservasCanceladas(condominioId = 1): Promise<any[]> {
  const res = await pool.query<ReservaRow>(
    `SELECT id, area, TO_CHAR(data_reserva, 'YYYY-MM-DD') AS data_reserva,
            horario_inicio, horario_fim, dia_inteiro, convidados, observacao, morador, status
     FROM reservas
     WHERE condominio_id = $1 AND status = ANY($2::text[])
     ORDER BY cancelado_em DESC`,
    [condominioId, STATUS_RESERVA_INATIVOS]
  );
  return res.rows.map(comHorarioExibicao);
}

export async function cancelarReserva(
  id: number,
  condominioId: number,
  canceladoPor: number | null
): Promise<{ id: number } | null> {
  const res = await pool.query(
    `UPDATE reservas
     SET status = 'CANCELADA', cancelado_em = NOW(), cancelado_por = $3
     WHERE id = $1 AND condominio_id = $2 AND status <> ALL($4::text[])
     RETURNING id`,
    [id, condominioId, canceladoPor, STATUS_RESERVA_INATIVOS]
  );
  return res.rows[0] ?? null;
}

// Restauração de uma reserva cancelada por engano. Diferente de usuário/enquete/condomínio,
// aqui não basta "desmarcar cancelado": o horário pode ter sido ocupado por outra reserva
// nesse meio-tempo, então a mesma checagem de conflito usada na criação roda de novo antes
// de reativar — se colidir, devolve o conflito em vez de restaurar.
export async function reativarReserva(
  id: number,
  condominioId: number
): Promise<{ ok: true; id: number } | { ok: false; erro: string } | null> {
  const atual = await pool.query<ReservaRow>(
    `SELECT id, area, TO_CHAR(data_reserva, 'YYYY-MM-DD') AS data_reserva,
            horario_inicio, horario_fim, dia_inteiro, status
     FROM reservas WHERE id = $1 AND condominio_id = $2 AND status = ANY($3::text[])`,
    [id, condominioId, STATUS_RESERVA_INATIVOS]
  );
  const reserva = atual.rows[0];
  if (!reserva) return null;

  const conflito = await verificarConflitoReserva(
    condominioId,
    reserva.area,
    reserva.data_reserva,
    reserva.horario_inicio,
    reserva.horario_fim,
    reserva.dia_inteiro,
    id
  );
  if (conflito) {
    return {
      ok: false,
      erro: `Não é possível restaurar: o horário já está ocupado por outra reserva no(a) ${reserva.area}.`,
    };
  }

  await pool.query(
    `UPDATE reservas SET status = 'CONFIRMADO', cancelado_em = NULL, cancelado_por = NULL WHERE id = $1`,
    [id]
  );
  return { ok: true, id };
}

