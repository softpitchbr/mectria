import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import type { SlideDoRoteiro } from "../../compartilhado/servico";
import html from "../../apresentacoes/desenho-tecnico.html?raw";
import roteiro from "../../apresentacoes/roteiros/desenho-tecnico.json";
import { testesDaProposta } from "./testesDaProposta";

testesDaProposta({
  html,
  roteiro: roteiro as SlideDoRoteiro[],
  servico: "Desenho Técnico",
  doresDoServico: servicosDaCarta().find((s) => s.id === "desenho-tecnico")!.dores,
  campos: ["retrabalhos-mes", "custo-retrabalho"],
  // 4 retrabalhos por mês × R$ 500 = R$ 2.000 por mês: R$ 24.000 por ano; R$ 24.000 se paga em 12 meses.
  conta: { valores: [4, 500], ano: "R$ 24.000", meses: "12 meses" },
});

test("o método é o de Desenho Técnico e a prova pede um caso do serviço", async () => {
  const { abrirDeck } = await import("./decks");
  const { texto } = await abrirDeck(html);
  expect(texto('[data-slide="metodo"]')).toContain("engenharia reversa");
  expect(texto('[data-slide="provas"]')).toContain("[Caso de Desenho Técnico, com autorização do cliente]");
});
