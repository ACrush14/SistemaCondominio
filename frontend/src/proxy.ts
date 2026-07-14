import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const CHAVE_SECRETA = process.env.JWT_SECRET!;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas (login, arquivos estáticos, PWA manifest/ícones)
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/cadastro") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/manifest.json") ||
    pathname.includes("favicon") ||
    pathname.includes(".png") ||
    pathname.includes(".ico")
  ) {
    return NextResponse.next();
  }

  // Busca token no Cookie de sessão ou no Header Authorization
  const token =
    req.cookies.get("sessao")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Acesso negado (401): Token de autenticação ausente na requisição API." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payload = jwt.verify(token, CHAVE_SECRETA) as {
      condominio_id?: number;
      condominios?: number[];
    };

    // O usuário pode ter escolhido, na sessão atual, qualquer condomínio dentre os que
    // o próprio token diz que ele tem acesso (cookie setado só pela rota
    // /api/auth/selecionar-condominio, que já confere isso antes de gravar o cookie).
    // Se o cookie não existir ou apontar pra um condomínio fora da lista permitida,
    // cai no condominio_id "principal" gravado na conta.
    let condominioEfetivo = payload.condominio_id ?? 1;
    const permitidos = payload.condominios ?? [condominioEfetivo];
    const escolhido = req.cookies.get("condominio_ativo")?.value;
    if (escolhido && /^\d+$/.test(escolhido) && permitidos.includes(Number(escolhido))) {
      condominioEfetivo = Number(escolhido);
    }

    // Sempre sobrescreve com o valor verificado do token — nunca confia num header vindo do cliente.
    const headers = new Headers(req.headers);
    headers.set("x-condominio-id", String(condominioEfetivo));

    return NextResponse.next({ request: { headers } });
  } catch (_erro) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Acesso negado (401): Token de autenticação inválido ou expirado." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/",
    "/reservas/:path*",
    "/ocorrencias/:path*",
    "/area-morador/:path*",
    "/portaria/:path*",
    "/usuarios/:path*",
    "/api/:path*",
  ],
};
