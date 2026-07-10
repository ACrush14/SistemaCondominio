import { NextResponse } from "next/server";

let visitantesDB = [
  {
    id: "1",
    nome: "Carlos Eduardo Silva",
    documento: "123.456.789-00",
    placa_veiculo: "ABC-1234",
    unidade_destino: "Apto 301",
    status: "ENTROU",
    data_entrada: new Date().toISOString(),
  },
  {
    id: "2",
    nome: "Entregador MercadoLivre",
    documento: "987.654.321-99",
    placa_veiculo: "XYZ-9988",
    unidade_destino: "Apto 501",
    status: "ENTROU",
    data_entrada: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(visitantesDB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const novo = {
      id: String(Date.now()),
      nome: body.nome || "Visitante",
      documento: body.documento || "-",
      placa_veiculo: body.placa_veiculo || "-",
      unidade_destino: body.unidade_destino || "-",
      status: "ENTROU",
      data_entrada: new Date().toISOString(),
    };
    visitantesDB.unshift(novo);
    return NextResponse.json(novo, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao registrar visitante" }, { status: 400 });
  }
}
