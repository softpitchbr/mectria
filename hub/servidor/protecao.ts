const METODOS_DE_LEITURA = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Pedido que muda dados e não veio do próprio hub (CSRF). Um formulário de outro site
 * não consegue mandar Content-Type: application/json sem preflight, e o navegador marca
 * a origem em Origin e Sec-Fetch-Site.
 */
export function pedidoDeOutroSite(req: Request): boolean {
  if (METODOS_DE_LEITURA.has(req.method)) return false;
  const tipo = (req.headers.get("Content-Type") ?? "").toLowerCase();
  if (!tipo.startsWith("application/json")) return true;
  const site = req.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin") return true;
  const origem = req.headers.get("Origin");
  if (origem && origem !== new URL(req.url).origin) return true;
  return false;
}

const DESTINOS_EM_QUADRO = new Set(["iframe", "frame", "embed", "object"]);
const ARQUIVO_DA_APRESENTACAO = /^\/api\/(servicos\/[^/]+\/apresentacao|apresentacoes\/[^/]+)$/;

/**
 * A API aberta dentro de um quadro (iframe). A apresentação em HTML roda isolada, mas consegue navegar
 * o próprio iframe; numa navegação o navegador manda o login, e a resposta apareceria na tela que o
 * vendedor compartilha. Só o próprio arquivo da apresentação abre em quadro.
 */
export function pedidoEmQuadro(req: Request): boolean {
  const destino = req.headers.get("Sec-Fetch-Dest");
  if (!destino || !DESTINOS_EM_QUADRO.has(destino)) return false;
  return !(req.method === "GET" && ARQUIVO_DA_APRESENTACAO.test(new URL(req.url).pathname));
}
