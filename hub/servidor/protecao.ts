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
