// O proxy.ts já validou o JWT e sempre sobrescreve este header com o condominio_id
// verificado do token — nunca confiar num valor vindo direto do cliente sem passar pelo proxy.
export function obterCondominioId(req: Request): number {
  const valor = req.headers.get("x-condominio-id");
  return valor ? parseInt(valor, 10) : 1;
}
