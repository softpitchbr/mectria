import { abrirCanal, type MensagemReuniao } from "./canal";

test("mensagem enviada num canal chega no outro da mesma reunião e não no de outra", async () => {
  const recebidas: MensagemReuniao[] = [];
  const outras: MensagemReuniao[] = [];
  const painel = abrirCanal(5, () => {});
  const janela = abrirCanal(5, (m) => recebidas.push(m));
  const outraReuniao = abrirCanal(6, (m) => outras.push(m));
  painel.enviar({ tipo: "slide", slide: 3 });
  await vi.waitFor(() => expect(recebidas).toEqual([{ tipo: "slide", slide: 3 }]));
  expect(outras).toEqual([]);
  painel.fechar();
  janela.fechar();
  outraReuniao.fechar();
});

test("sem BroadcastChannel no navegador, o canal não quebra", () => {
  vi.stubGlobal("BroadcastChannel", undefined);
  const canal = abrirCanal(5, () => {});
  expect(() => canal.enviar({ tipo: "viva" })).not.toThrow();
  canal.fechar();
  vi.unstubAllGlobals();
});
