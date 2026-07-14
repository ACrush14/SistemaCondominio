import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  // Desativa amigavelmente o rastreamento no Edge se o DSN não estiver configurado no ambiente
  enabled: Boolean(dsn),
  tracesSampleRate: 1.0,
  debug: false,
});
