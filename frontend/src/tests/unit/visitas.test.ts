import { describe, it, expect } from "vitest";
import {
  gerarCodigoVisita,
  validarFormatoCodigoVisita,
  validarStatusECodigoVisita,
  LiberacaoVisita,
} from "../../lib/visitas";

describe("Visitas e Portaria — Código de 6 Dígitos", () => {
  describe("gerarCodigoVisita", () => {
    it("deve gerar um código numérico de exatamente 6 dígitos", () => {
      const codigo = gerarCodigoVisita();
      expect(typeof codigo).toBe("string");
      expect(codigo).toHaveLength(6);
      expect(/^\d{6}$/.test(codigo)).toBe(true);
    });

    it("deve gerar códigos aleatórios (não constantes)", () => {
      const codigos = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codigos.add(gerarCodigoVisita());
      }
      // Pelo menos 40 códigos distintos em 50 rodadas aleatórias
      expect(codigos.size).toBeGreaterThan(40);
    });
  });

  describe("validarFormatoCodigoVisita", () => {
    it("deve retornar true para códigos numéricos de 6 dígitos válidos", () => {
      expect(validarFormatoCodigoVisita("123456")).toBe(true);
      expect(validarFormatoCodigoVisita("000001")).toBe(true);
      expect(validarFormatoCodigoVisita(" 999999 ")).toBe(true);
    });

    it("deve retornar false para formatos inválidos", () => {
      expect(validarFormatoCodigoVisita("12345")).toBe(false); // 5 dígitos
      expect(validarFormatoCodigoVisita("1234567")).toBe(false); // 7 dígitos
      expect(validarFormatoCodigoVisita("ABCDEF")).toBe(false); // letras
      expect(validarFormatoCodigoVisita("123-56")).toBe(false);
      expect(validarFormatoCodigoVisita("")).toBe(false);
      expect(validarFormatoCodigoVisita(null)).toBe(false);
      expect(validarFormatoCodigoVisita(undefined)).toBe(false);
    });
  });

  describe("validarStatusECodigoVisita", () => {
    const hoje = new Date("2026-07-14T12:00:00Z");

    it("deve aprovar liberação válida com data futura", () => {
      const liberacao: LiberacaoVisita = {
        codigo: "123456",
        status: "ATIVO",
        expira_em: "2026-07-15T12:00:00Z",
      };
      const res = validarStatusECodigoVisita(liberacao, hoje);
      expect(res.valido).toBe(true);
      expect(res.statusHttp).toBe(200);
      expect(res.erro).toBeUndefined();
    });

    it("deve recusar liberação inexistente (null/undefined)", () => {
      const res = validarStatusECodigoVisita(null, hoje);
      expect(res.valido).toBe(false);
      expect(res.statusHttp).toBe(404);
      expect(res.erro).toBe("Código inválido.");
    });

    it("deve recusar liberação com status USADO", () => {
      const liberacao: LiberacaoVisita = {
        codigo: "123456",
        status: "USADO",
        expira_em: "2026-07-15T12:00:00Z",
      };
      const res = validarStatusECodigoVisita(liberacao, hoje);
      expect(res.valido).toBe(false);
      expect(res.statusHttp).toBe(409);
      expect(res.erro).toBe("Este código já foi utilizado.");
    });

    it("deve recusar liberação com status CANCELADO", () => {
      const liberacao: LiberacaoVisita = {
        codigo: "123456",
        status: "CANCELADO",
        expira_em: "2026-07-15T12:00:00Z",
      };
      const res = validarStatusECodigoVisita(liberacao, hoje);
      expect(res.valido).toBe(false);
      expect(res.statusHttp).toBe(410);
      expect(res.erro).toBe("Este código foi cancelado.");
    });

    it("deve recusar liberação cuja data de expiração passou", () => {
      const liberacao: LiberacaoVisita = {
        codigo: "123456",
        status: "ATIVO",
        expira_em: "2026-07-13T12:00:00Z", // expirou ontem
      };
      const res = validarStatusECodigoVisita(liberacao, hoje);
      expect(res.valido).toBe(false);
      expect(res.statusHttp).toBe(410);
      expect(res.erro).toBe("Este código expirou.");
    });
  });
});
