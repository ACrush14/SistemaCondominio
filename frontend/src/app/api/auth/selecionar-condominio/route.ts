import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { pool } from "../../../../lib/store/db";

interface PayloadSessao {
  perfil: string;
}

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("sessao="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ erro: "Sem sessão ativa." }, { status: 401 });
  }

  let payload: PayloadSessao;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadSessao;
  } catch (_erro) {
    return NextResponse.json({ erro: "Sessão inválida." }, { status: 401 });
  }

  if (payload.perfil !== "SUPER_ADMIN") {
    return NextResponse.json(
      { erro: "Só o Super Admin pode alternar entre condomínios." },
      { status: 403 }
    );
  }

  const { condominio_id } = await req.json();
  const idNumerico = Number(condominio_id);

  const existe = await pool.query("SELECT id, nome FROM condominios WHERE id = $1", [idNumerico]);
  if (existe.rowCount === 0) {
    return NextResponse.json({ erro: "Condomínio não encontrado." }, { status: 404 });
  }

  const resposta = NextResponse.json({
    mensagem: `Condomínio ativo alterado para: ${existe.rows[0].nome}`,
    condominio: existe.rows[0],
  });

  resposta.cookies.set("condominio_ativo", String(idNumerico), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return resposta;
}
