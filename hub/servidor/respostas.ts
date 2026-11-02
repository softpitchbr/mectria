export type CodigoErro = "sem_identidade" | "sem_acesso" | "invalido" | "conflito" | "nao_encontrado" | "ultimo_diretor";

const STATUS: Record<CodigoErro, number> = {
  sem_identidade: 401,
  sem_acesso: 403,
  invalido: 400,
  conflito: 409,
  nao_encontrado: 404,
  ultimo_diretor: 409,
};

export function json(dados: unknown, status = 200): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function erro(codigo: CodigoErro, mensagem: string): Response {
  return json({ erro: codigo, mensagem }, STATUS[codigo]);
}
