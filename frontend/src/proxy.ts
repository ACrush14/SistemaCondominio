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
    jwt.verify(token, CHAVE_SECRETA);
    return NextResponse.next();
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
