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

// Mesmo padrão dos headers acima — o proxy.ts já verificou o JWT e sempre sobrescreve
// este valor, nunca confia em nada vindo direto do cliente.
export function obterPerfil(req: Request): string | null {
  return req.headers.get("x-perfil");
}
