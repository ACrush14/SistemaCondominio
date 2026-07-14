import { NextResponse } from "next/server";

export async function POST() {
  const resposta = NextResponse.json({ mensagem: "Sessão encerrada com sucesso." });
  resposta.cookies.delete("sessao");
  resposta.cookies.delete("condominio_ativo");
  return resposta;
}
