import { NextResponse } from "next/server";
import { encomendasDB } from "../../../../lib/store/encomendas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unidade = searchParams.get("unidade");

  if (unidade) {
    const filtradas = encomendasDB.filter((e) => e.unidade === unidade);
    return NextResponse.json(filtradas);
  }

  return NextResponse.json(encomendasDB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nova = {
      id: String(Date.now()),
      unidade: body.unidade || "-",
      morador: body.morador || "Morador",
      codigo: body.codigo || "-",
      remetente: body.remetente || "Transportadora",
      status: "AGUARDANDO_AVISO" as const,
      data_chegada: "Hoje, " + new Date().toLocaleTimeString().slice(0, 5),
    };
    encomendasDB.unshift(nova);
    return NextResponse.json(nova, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao registrar encomenda" }, { status: 400 });
  }
}
