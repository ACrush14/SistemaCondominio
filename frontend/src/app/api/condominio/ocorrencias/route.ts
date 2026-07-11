import { NextResponse } from "next/server";

let ocorrenciasDB = [
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
      "Sensor ótico foi alinhado pela equipe técnica técnica do condomínio. Funcionamento restabelecido.",
  },
];

export async function GET() {
  return NextResponse.json(ocorrenciasDB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nova = {
      id: String(Date.now()),
      titulo: body.titulo || "Nova Ocorrência",
      local: body.local || "Condomínio",
      unidade: body.unidade || "-",
      morador: body.morador || "Morador",
      status: "EM ANÁLISE",
      categoria: body.categoria || "GERAL",
      data: "Hoje, " + new Date().toLocaleTimeString().slice(0, 5),
      resumo_ia:
        body.descricao || "Ocorrência registrada no sistema e encaminhada para análise do Síndico.",
    };
    ocorrenciasDB.unshift(nova);
    return NextResponse.json(nova, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao cadastrar ocorrência" }, { status: 400 });
  }
}
