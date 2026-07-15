import { NextResponse } from "next/server";
import { listarCondominiosPublico } from "../../../../lib/store/condominiosDb";

export async function GET() {
  try {
    const lista = await listarCondominiosPublico();
    return NextResponse.json(lista);
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar condomínios: " + msg }, { status: 500 });
  }
}
