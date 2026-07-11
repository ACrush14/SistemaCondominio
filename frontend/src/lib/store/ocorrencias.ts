export interface Ocorrencia {
  id: string;
  titulo: string;
  local: string;
  unidade: string;
  morador: string;
  status: "EM ANÁLISE" | "MANUTENÇÃO" | "RESOLVIDO";
  categoria: string;
  data: string;
  resumo_ia: string;
}

function seedOcorrencias(): Ocorrencia[] {
  return [
    {
      id: "1",
      titulo: "Barulho excessivo após as 22h",
      local: "Salão de Festas",
      unidade: "Apto 202",
      morador: "Ricardo Ferreira",
      status: "EM ANÁLISE",
      categoria: "CONVIVÊNCIA",
      data: "Ontem, 23:15",
      resumo_ia:
        "Morador relatou som alto vindo da área de festas após o horário permitido. Foi emitido alerta de moderação pelo síndico.",
    },
    {
      id: "2",
      titulo: "Vazamento na Garagem Subsolo 2",
      local: "Garagem Subsolo 2",
      unidade: "Apto 302",
      morador: "Lucas Siqueira",
      status: "MANUTENÇÃO",
      categoria: "MANUTENÇÃO",
      data: "Hoje, 14:30",
      resumo_ia:
        "Morador relatou poça d'água próximo à vaga 42. Provável origem: tubulação do teto. Requer inspeção do zelador.",
    },
    {
      id: "3",
      titulo: "Portão da garagem com demora para fechar",
      local: "Portaria Principal",
      unidade: "Administração",
      morador: "Fulano Alterado (Porteiro)",
      status: "RESOLVIDO",
      categoria: "SEGURANÇA",
      data: "10/07/2026, 08:00",
      resumo_ia:
        "Sensor ótico foi alinhado pela equipe técnica do condomínio. Funcionamento restabelecido.",
    },
  ];
}

// Ancorado no globalThis: o Next.js (Turbopack) empacota cada arquivo de rota
// separadamente, então um `export const` comum aqui gera uma cópia distinta
// por rota. globalThis é o único objeto realmente compartilhado pelo processo.
declare global {
  // eslint-disable-next-line no-var
  var __ocorrenciasDB: Ocorrencia[] | undefined;
}

export const ocorrenciasDB: Ocorrencia[] =
  globalThis.__ocorrenciasDB ?? (globalThis.__ocorrenciasDB = seedOcorrencias());
