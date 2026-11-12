/**
 * Monta uma apresentação: troca as marcas <!-- kit:css --> e <!-- kit:js --> da fonte pelo kit,
 * para sair um arquivo .html só, com tudo dentro (é o que o diretor envia ao hub).
 * Sem nada de Node aqui: o teste usa a mesma função.
 */
export function montarDeck(fonte: string, css: string, js: string): string {
  return fonte.replace("<!-- kit:css -->", () => `<style>\n${css}\n</style>`).replace("<!-- kit:js -->", () => `<script>\n${js}\n</script>`);
}
