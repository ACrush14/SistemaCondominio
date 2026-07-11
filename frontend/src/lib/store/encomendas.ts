export interface Encomenda {
  id: string;
  unidade: string;
  morador: string;
  codigo: string;
  remetente: string;
  status: "AGUARDANDO_AVISO" | "AGUARDANDO_RETIRADA" | "ENTREGUE";
  data_chegada: string;
}

function seedEncomendas(): Encomenda[] {
  return [
    {
      id: "1",
      unidade: "Apto 402",
      morador: "Gabriel Souza",
      codigo: "BR982341829BR",
      remetente: "Amazon",
      status: "AGUARDANDO_RETIRADA",
      data_chegada: "Hoje, 10:15",
    },
    {
      id: "2",
      unidade: "Apto 301",
      morador: "João (Morador Tailson)",
      codigo: "IFOOD-4471",
      remetente: "iFood",
      status: "AGUARDANDO_AVISO",
      data_chegada: "Hoje, 14:30",
    },
  ];
}

// Ver comentário equivalente em lib/store/ocorrencias.ts sobre o porquê do globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __encomendasDB: Encomenda[] | undefined;
}

export const encomendasDB: Encomenda[] =
  globalThis.__encomendasDB ?? (globalThis.__encomendasDB = seedEncomendas());
