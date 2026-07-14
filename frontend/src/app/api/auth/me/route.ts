import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { obterCondominioId } from "../../../../lib/tenant";

interface PayloadSessao {
  id: number;
  nome: string;
  perfil: string;
  unidade: string;
  condominio_id?: number;
  condominios?: number[];
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("sessao="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ erro: "Sem sessão ativa." }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadSessao;
    return NextResponse.json({
      id: payload.id,
      nome: payload.nome,
      perfil: payload.perfil,
      unidade: payload.unidade,
      // condominio_id EFETIVO (já considera troca feita via /api/auth/selecionar-condominio)
      // — o proxy.ts já calculou isso no header.
      condominio_id: obterCondominioId(req),
      // Todos os condomínios que esta conta pode acessar/alternar (tabela usuario_condominios).
      condominios: payload.condominios ?? [payload.condominio_id ?? 1],
    });
  } catch (_erro) {
    return NextResponse.json({ erro: "Sessão inválida." }, { status: 401 });
  }
}
