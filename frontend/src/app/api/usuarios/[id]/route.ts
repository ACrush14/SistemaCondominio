import { NextResponse } from "next/server";
import { usuariosDB } from "../../../../lib/store/usuarios";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const indice = usuariosDB.findIndex((u) => u.id === id);

  if (indice === -1) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  usuariosDB.splice(indice, 1);
  return NextResponse.json({ mensagem: `Usuário ${id} revogado com sucesso.` });
}
