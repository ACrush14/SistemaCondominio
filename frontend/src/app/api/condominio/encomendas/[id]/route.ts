import { NextResponse } from "next/server";
import { encomendasDB } from "../../../../../lib/store/encomendas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const encomenda = encomendasDB.find((e) => e.id === id);
  if (!encomenda) {
    return NextResponse.json({ erro: "Encomenda não encontrada." }, { status: 404 });
  }

  if (body.status) {
    encomenda.status = body.status;
  }

  return NextResponse.json(encomenda);
}
