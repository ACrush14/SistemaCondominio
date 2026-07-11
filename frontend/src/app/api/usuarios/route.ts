import { NextResponse } from "next/server";
import { usuariosDB } from "../../../lib/store/usuarios";

export async function GET() {
  return NextResponse.json(usuariosDB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const novo = {
      id: String(Date.now()),
      nome: body.nome,
      email: body.email,
      perfil: body.perfil || "MORADOR",
      unidade: body.unidade || "-",
      status: "ATIVO" as const,
    };
    usuariosDB.push(novo);
    return NextResponse.json(novo, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao cadastrar usuário" }, { status: 400 });
  }
}
