import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

function obterConnectionString(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("A variável de ambiente DATABASE_URL não está definida!");
  }
  const url = process.env.DATABASE_URL!;
  if (!url.includes("uselibpqcompat=")) {
    const separador = url.includes("?") ? "&" : "?";
    return `${url}${separador}uselibpqcompat=true`;
  }
  return url;
}

export const pool: Pool =
  globalThis.__pgPool ??
  (globalThis.__pgPool = new Pool({
    connectionString: obterConnectionString(),
  }));
