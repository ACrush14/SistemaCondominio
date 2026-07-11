import { NextResponse } from "next/server";
import { ocorrenciasDB } from "../../../../../lib/store/ocorrencias";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const ocorrencia = ocorrenciasDB.find((o) => o.id === id);
  if (!ocorrencia) {
    return NextResponse.json({ erro: "Ocorrência não encontrada." }, { status: 404 });
  }

  if (body.status) {
    ocorrencia.status = body.status;
  }

  return NextResponse.json(ocorrencia);
}
