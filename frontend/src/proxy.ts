import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const CHAVE_SECRETA = process.env.JWT_SECRET!;

// Páginas/rotas de API restritas por perfil — só entra aqui o que é claramente
// "admin-only" (gestão de usuários, painel do síndico, operação da portaria). Tudo que
// não bater com nenhuma entrada aqui continua aberto a qualquer perfil autenticado
// (os dados em si já são protegidos por condominio_id nas rotas, isso aqui é a camada
// de "esse perfil nem deveria estar vendo essa tela/rota").
const RESTRICOES_POR_PERFIL: { prefixo: string; perfis: string[] }[] = [
  { prefixo: "/usuarios", perfis: ["SINDICO"] },
  { prefixo: "/api/usuarios", perfis: ["SINDICO"] },
  { prefixo: "/moradores", perfis: ["SINDICO"] },
  { prefixo: "/portaria", perfis: ["SINDICO", "PORTEIRO"] },
];

function perfilPermitido(pathname: string, perfil: string | undefined): boolean {
  if (pathname === "/") return perfil === "SINDICO";
  const regra = RESTRICOES_POR_PERFIL.find((r) => pathname.startsWith(r.prefixo));
  if (!regra) return true;
  return !!perfil && regra.perfis.includes(perfil);
}

// Pra onde mandar de volta quem tentou acessar uma tela fora do seu perfil — a home de
// cada um, não um erro genérico.
function homeDoPerfil(perfil: string | undefined): string {
  if (perfil === "MORADOR") return "/area-morador";
  if (perfil === "PORTEIRO") return "/portaria";
  return "/";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas e de cron (login, arquivos estáticos, cron jobs, PWA manifest/ícones)
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/cadastro") ||
    pathname.startsWith("/api/auth/esqueci-senha") ||
    pathname.startsWith("/api/auth/redefinir-senha") ||
    pathname.startsWith("/api/condominios/publico") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/esqueci-senha") ||
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
      id?: number;
      perfil?: string;
      condominio_id?: number;
      condominios?: number[];
    };

    if (!perfilPermitido(pathname, payload.perfil)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { erro: "Acesso negado (403): seu perfil não tem permissão para acessar este recurso." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL(homeDoPerfil(payload.perfil), req.url));
    }

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
    if (payload.id) {
      headers.set("x-usuario-id", String(payload.id));
    }

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
    "/moradores/:path*",
    "/api/:path*",
  ],
};
