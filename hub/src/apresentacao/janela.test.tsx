import { act, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { montarSlides, slidesDaProposta } from "../../compartilhado/proposta";
import { abrirCanal, type MensagemReuniao } from "../reuniao/canal";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const slides = montarSlides(slidesDaProposta(), { empresa: "Usinagem Alfa", servico: "Climatização" }, new Set());

function painelFalso() {
  const recebidas: MensagemReuniao[] = [];
  const canal = abrirCanal(5, (m) => recebidas.push(m));
  return { recebidas, canal };
}

afterEach(() => vi.useRealTimers());

test("a janela pede o estado e desenha o slide que o painel mandar", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slides, slide: 1 }));
  expect(await screen.findByRole("heading", { name: "O projeto que desenhamos para vocês" })).toBeInTheDocument();
  act(() => painel.canal.enviar({ tipo: "slide", slide: 4 }));
  expect(await screen.findByRole("heading", { name: "O time" })).toBeInTheDocument();
  painel.canal.fechar();
});

test("seta na janela da apresentação avisa o painel", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  fireEvent.keyDown(window, { key: "ArrowRight" });
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "tecla", tecla: "ArrowRight" }));
  painel.canal.fechar();
});

test("o título da janela é Apresentação · {empresa}", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slides, slide: 0 }));
  await vi.waitFor(() => expect(document.title).toBe("Apresentação · Usinagem Alfa"));
  painel.canal.fechar();
});

test("a janela não mostra fala, dica nem pendência destacada", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slides, slide: 1 }));
  await screen.findByRole("heading", { name: "O projeto que desenhamos para vocês" });
  expect(screen.queryByText(/obrigado pelo tempo/)).not.toBeInTheDocument();
  expect(document.querySelector("mark")).toBeNull();
  painel.canal.fechar();
});

test("a janela manda sinal de vida a cada 2 segundos", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await act(() => vi.advanceTimersByTimeAsync(4100));
  await vi.waitFor(() => expect(painel.recebidas.filter((m) => m.tipo === "viva").length).toBeGreaterThanOrEqual(2));
  painel.canal.fechar();
});
