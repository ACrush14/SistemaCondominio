import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  const ativo = Boolean(dsn);

  if (!ativo) {
    return NextResponse.json({
      sucesso: true,
      sentryAtivo: false,
      mensagem:
        "Sentry está inativo neste ambiente pois as variáveis SENTRY_DSN e NEXT_PUBLIC_SENTRY_DSN não estão configuradas. Nenhuma exceção foi enviada.",
    });
  }

  try {
    throw new Error("Erro simulado para teste de captura do Sentry (Rota /api/sentry-teste - GET)");
  } catch (erro) {
    const eventId = Sentry.captureException(erro);
    return NextResponse.json({
      sucesso: true,
      sentryAtivo: true,
      mensagem: "Exceção simulada capturada pelo Sentry com sucesso!",
      eventId: eventId || "capturado",
    });
  }
}

export async function POST() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  const ativo = Boolean(dsn);

  if (!ativo) {
    return NextResponse.json({
      sucesso: true,
      sentryAtivo: false,
      mensagem:
        "Sentry está inativo neste ambiente pois as variáveis SENTRY_DSN e NEXT_PUBLIC_SENTRY_DSN não estão configuradas. Nenhuma exceção foi enviada.",
    });
  }

  try {
    throw new Error("Erro simulado para teste de captura do Sentry (Rota /api/sentry-teste - POST)");
  } catch (erro) {
    const eventId = Sentry.captureException(erro);
    return NextResponse.json({
      sucesso: true,
      sentryAtivo: true,
      mensagem: "Exceção simulada capturada pelo Sentry com sucesso!",
      eventId: eventId || "capturado",
    });
  }
}
