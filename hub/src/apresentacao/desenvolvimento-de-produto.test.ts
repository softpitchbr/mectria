import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import type { SlideDoRoteiro } from "../../compartilhado/servico";
import html from "../../apresentacoes/desenvolvimento-de-produto.html?raw";
import roteiro from "../../apresentacoes/roteiros/desenvolvimento-de-produto.json";
import { testesDaProposta } from "./testesDaProposta";

testesDaProposta({
  html,
  roteiro: roteiro as SlideDoRoteiro[],
  servico: "Desenvolvimento de Produto",
  doresDoServico: servicosDaCarta().find((s) => s.id === "desenvolvimento-de-produto")!.dores,
  campos: ["horas-manuais", "custo-hora"],
  // 20 h por mês × R$ 50 = R$ 1.000 por mês: R$ 12.000 por ano; R$ 24.000 se paga em 24 meses.
  conta: { valores: [20, 50], ano: "R$ 12.000", meses: "24 meses" },
});
