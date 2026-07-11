import { NextResponse } from "next/server";
import { ocorrenciasDB } from "../../../../lib/store/ocorrencias";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unidade = searchParams.get("unidade");

  if (unidade) {
    const filtradas = ocorrenciasDB.filter((o) => o.unidade === unidade);
    return NextResponse.json(filtradas);
  }

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
      status: "EM ANÁLISE" as const,
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
