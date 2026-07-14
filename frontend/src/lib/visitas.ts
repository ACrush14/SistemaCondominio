export interface LiberacaoVisita {
  id?: number;
  codigo: string;
  status: string;
  expira_em: string | Date;
  nome_visitante?: string | null;
  unidade?: string;
  morador?: string | null;
}

export interface ResultadoValidacaoVisita {
  valido: boolean;
  erro?: string;
  statusHttp: number;
}

/**
 * Gera um código numérico de 6 dígitos formatado com zeros à esquerda (ex: "048192").
 */
export function gerarCodigoVisita(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

/**
 * Verifica se uma string de código tem exatamente 6 dígitos numéricos.
 */
export function validarFormatoCodigoVisita(codigo?: string | null): boolean {
  if (!codigo || typeof codigo !== "string") return false;
  const limpo = codigo.trim();
  return /^\d{6}$/.test(limpo);
}

/**
 * Valida o status e a expiração de uma liberação de visita.
 * Função pura e testável sem dependência de banco de dados.
 */
export function validarStatusECodigoVisita(
  liberacao: LiberacaoVisita | null | undefined,
  dataAtual: Date = new Date()
): ResultadoValidacaoVisita {
  if (!liberacao) {
    return { valido: false, erro: "Código inválido.", statusHttp: 404 };
  }

  if (liberacao.status === "USADO") {
    return { valido: false, erro: "Este código já foi utilizado.", statusHttp: 409 };
  }

  if (liberacao.status === "CANCELADO" || liberacao.status === "CANCELADA") {
    return { valido: false, erro: "Este código foi cancelado.", statusHttp: 410 };
  }

  const expira = new Date(liberacao.expira_em);
  if (isNaN(expira.getTime()) || expira < dataAtual) {
    return { valido: false, erro: "Este código expirou.", statusHttp: 410 };
  }

  return { valido: true, statusHttp: 200 };
}
