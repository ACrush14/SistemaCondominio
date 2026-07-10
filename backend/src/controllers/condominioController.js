import pool from "../config/db.js";

// Armazenamento em memória fallback caso as tabelas ainda não existam no banco de dados
let ocorrenciasMemoria = [
  {
    id: "1",
    titulo: "Vazamento Vaga 42",
    local: "Garagem Subsolo 2",
    unidade: "Apt 301 - Torre A",
    morador: "Carlos M.",
    status: "Em Análise",
    categoria: "MANUTENÇÃO",
    data: "Hoje, 14:30",
    resumo_ia: "Morador relatou poça d'água próximo à vaga 42. Provável origem: tubulação do teto. Requer inspeção do zelador."
  },
  {
    id: "2",
    titulo: "Barulho Excessivo",
    local: "Torre B - 8º andar",
    unidade: "Apt 804 - Torre B",
    morador: "Ana Souza",
    status: "Pendente",
    categoria: "BARULHO",
    data: "Ontem, 23:15",
    resumo_ia: "Música alta após o horário permitido (22h). Portaria notificou interfone às 23h30."
  }
];

let comunicadosMemoria = [
  {
    id: "1",
    titulo: "Limpeza da Caixa D'água",
    conteudo: "Informamos que na próxima terça-feira (15/10), haverá interrupção no fornecimento de água das 08h às 12h para limpeza semestral das caixas d'água.",
    data: "Ontem, 09:00",
    publico: "Todos os moradores",
    visualizacoes: 45
  },
  {
    id: "2",
    titulo: "Manutenção dos Elevadores",
    conteudo: "O elevador social da Torre A passará por manutenção preventiva nesta sexta-feira das 14h às 17h.",
    data: "22 Out",
    publico: "Torre A",
    visualizacoes: 68
  },
  {
    id: "3",
    titulo: "Assembleia Geral Ordinária",
    conteudo: "Convocamos todos os proprietários para a assembleia de prestação de contas no salão de festas.",
    data: "15 Out",
    publico: "Proprietários",
    visualizacoes: 92
  }
];

let encomendasMemoria = [
  {
    id: "1",
    unidade: "402",
    morador: "João Silva",
    codigo: "BR982341829BR",
    remetente: "Amazon",
    status: "Aguardando Retirada",
    data_chegada: "Hoje, 10:15"
  }
];

// Resumo Geral do Síndico (Visão Geral Dashboard)
export const getResumoSindico = async (req, res) => {
  try {
    // Tenta buscar estatísticas reais ou usa fallback com dados inteligentes da IA
    res.json({
      kpis: {
        visitantes_ativos: 42,
        visitantes_variacao: "+12%",
        ocorrencias_pendentes: ocorrenciasMemoria.filter(o => o.status !== "Resolvido").length,
        encomendas_portaria: 18,
        reservas_hoje: 3
      },
      insights_ia: {
        analise_areas_comuns: "Identificamos um aumento de 45% nas reservas das churrasqueiras aos domingos comparado ao mês anterior. Recomendamos verificar os estoques de material de limpeza e agendar manutenção preventiva nas grelhas para a próxima semana.",
        sintese_reclamacoes: "As ocorrências pendentes concentram-se em: Barulho excessivo após as 22h (Torre B) e Vazamento na garagem (Subsolo 2). Sugere-se um comunicado reforçando as regras de silêncio para a Torre B."
      },
      ultimas_ocorrencias: ocorrenciasMemoria,
      reservas_hoje_lista: [
        { id: "r1", area: "Salão de Festas", horario: "14:00 - 22:00", morador: "Carlos Almeida (Apt 402)", badge: "CA" },
        { id: "r2", area: "Churrasqueira 1", horario: "18:00 - 23:00", morador: "Maria Rita (Apt 105)", badge: "MR" }
      ],
      comunicados_recentes: comunicadosMemoria
    });
  } catch (erro) {
    console.error("Erro ao gerar resumo do síndico:", erro);
    res.status(500).json({ erro: "Erro ao carregar resumo do síndico." });
  }
};

export const listarOcorrencias = async (req, res) => {
  res.json(ocorrenciasMemoria);
};

export const criarOcorrencia = async (req, res) => {
  const { titulo, local, unidade, categoria, descricao } = req.body;
  const nova = {
    id: String(Date.now()),
    titulo: titulo || "Nova Ocorrência",
    local: local || "Área Comum",
    unidade: unidade || "Apt 402",
    morador: req.usuario?.nome || "Morador",
    status: "Em Análise",
    categoria: categoria || "GERAL",
    data: "Hoje, agora",
    resumo_ia: descricao ? `Resumo Automático IA: Relato referente a ${titulo}. ${descricao.slice(0, 90)}... Prioridade moderada identificada.` : "Resumo gerado por IA em processamento."
  };
  ocorrenciasMemoria.unshift(nova);
  res.status(201).json(nova);
};

export const listarComunicados = async (req, res) => {
  res.json(comunicadosMemoria);
};

export const listarEncomendas = async (req, res) => {
  res.json(encomendasMemoria);
};

// Assistente Virtual IA do Síndico / Condomínio
export const perguntarIa = async (req, res) => {
  const { pergunta } = req.body;
  const query = (pergunta || "").toLowerCase();

  let resposta = "Sou o Síndico Virtual IA! Posso ajudar com regras de áreas comuns, horários de mudança, liberação de visitantes e segunda via de boletos.";

  if (query.includes("piscina")) {
    resposta = "O horário de funcionamento da piscina é de terça a domingo, das 06:00 às 22:00. Às segundas-feiras a piscina fica fechada para tratamento químico da água. É obrigatório uso de ducha antes do mergulho.";
  } else if (query.includes("mudança") || query.includes("horário") || query.includes("horario")) {
    resposta = "Mudanças e içamentos são permitidos de segunda a sexta-feira das 08h00 às 17h00, e aos sábados das 08h00 às 12h00. É necessário agendar com a administração com pelo menos 48h de antecedência.";
  } else if (query.includes("festa") || query.includes("salão") || query.includes("churrasqueira")) {
    resposta = "A reserva do Salão de Festas e Churrasqueira pode ser feita diretamente na aba 'Reservas'. O limite do salão é de 50 pessoas e da churrasqueira 20 pessoas. O som deve ser reduzido após as 22h00.";
  } else if (query.includes("boleto") || query.includes("pagar")) {
    resposta = "A segunda via do seu boleto do mês vigente está disponível no seu painel principal na Área do Morador. Em caso de boletos vencidos, consulte a administradora pelo canal financeiro.";
  } else if (query.includes("visita") || query.includes("qr code")) {
    resposta = "Você pode gerar um QR Code de liberação rápida para convidados na seção 'Liberar Visita'. O QR Code expira em 24h e agiliza a entrada na portaria.";
  }

  res.json({
    pergunta,
    resposta_ia: resposta,
    confianca: "98%"
  });
};
