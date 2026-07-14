import { NextResponse } from "next/server";
import {
  listarCondominios,
  atualizarCondominio,
  excluirCondominio,
} from "../../../../lib/store/condominiosDb";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ erro: "ID do condomínio inválido." }, { status: 400 });
    }

    const body = await req.json();
    const atualizado = await atualizarCondominio(numId, body);
    const lista = await listarCondominios();

    return NextResponse.json({
      sucesso: true,
      condominio: atualizado,
      condominios: lista,
    });
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao atualizar condomínio: " + msg }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ erro: "ID do condomínio inválido." }, { status: 400 });
    }

    await excluirCondominio(numId);
    const lista = await listarCondominios();

    return NextResponse.json({
      sucesso: true,
      condominios: lista,
    });
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    if (
      msg.includes("foreign key") ||
      msg.includes("violates foreign key constraint") ||
      msg.includes("23503") ||
      msg.includes("violada")
    ) {
      return NextResponse.json(
        {
          erro:
            "Não é possível excluir este condomínio pois existem moradores, usuários ou registros vinculados a ele.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ erro: "Erro ao excluir condomínio: " + msg }, { status: 400 });
  }
}
