import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return NextResponse.json({ mensagem: `Usuário ${resolvedParams.id} revogado com sucesso.` });
}
