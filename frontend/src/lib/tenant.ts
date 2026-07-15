// O proxy.ts já validou o JWT e sempre sobrescreve este header com o condominio_id
// verificado do token — nunca confiar num valor vindo direto do cliente sem passar pelo proxy.
export function obterCondominioId(req: Request): number {
  const valor = req.headers.get("x-condominio-id");
  return valor ? parseInt(valor, 10) : 1;
}

// Mesmo padrão do header acima, só que com o id do usuário logado (não o condomínio) —
// usado hoje só pra limite de uso diário de IA, não é uma checagem de autorização.
export function obterUsuarioId(req: Request): number | null {
  const valor = req.headers.get("x-usuario-id");
  const n = valor ? parseInt(valor, 10) : NaN;
  return isNaN(n) ? null : n;
}
