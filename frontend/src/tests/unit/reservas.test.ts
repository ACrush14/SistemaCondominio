import { describe, it, expect } from "vitest";
import { calcularDiferencaDias } from "../../lib/store/reservasDb";

describe("Reservas — Regra de Antecedência (Até 30 Dias e Não no Passado)", () => {
  const dataBase = new Date("2026-07-14T15:30:00"); // 14 de Julho de 2026

  it("deve retornar 0 dias de diferença ao reservar para hoje (mesmo dia)", () => {
    const diff = calcularDiferencaDias("2026-07-14", dataBase);
    expect(diff).toBe(0);
    expect(diff >= 0 && diff <= 30).toBe(true);
  });

  it("deve permitir agendamento exatamente no limite regimental de 30 dias de antecedência", () => {
    // 14 de Julho + 30 dias = 13 de Agosto
    const diff = calcularDiferencaDias("2026-08-13", dataBase);
    expect(diff).toBe(30);
    expect(diff >= 0 && diff <= 30).toBe(true);
  });

  it("deve recusar/retornar > 30 para agendamentos com 31 dias de antecedência (fora do prazo permitido)", () => {
    // 14 de Julho + 31 dias = 14 de Agosto
    const diff = calcularDiferencaDias("2026-08-14", dataBase);
    expect(diff).toBe(31);
    expect(diff > 30).toBe(true);
  });

  it("deve recusar/retornar negativo para datas no passado (ontem ou anterior)", () => {
    const diff = calcularDiferencaDias("2026-07-13", dataBase);
    expect(diff).toBe(-1);
    expect(diff < 0).toBe(true);
  });

  it("deve retornar NaN para strings de data inválidas", () => {
    const diff = calcularDiferencaDias("data-invalida", dataBase);
    expect(Number.isNaN(diff)).toBe(true);
  });
});
