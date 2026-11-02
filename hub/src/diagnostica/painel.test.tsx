import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DIAGNOSTICA } from "../../compartilhado/dados/diagnostica";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const FICHA = {
  reuniao: {
    id: 5,
    oportunidadeId: 1,
    empresa: "Usinagem Alfa",
    tipo: "diagnostica",
    dataHora: "2026-11-13T10:00",
    formato: "online",
    situacao: "em_andamento",
    closerId: 2,
    closerNome: "Vinícius Miguel",
    quemDecide: null,
    iniciadaEm: null,
    encerradaEm: null,
    resultado: null,
    motivo: null,
    briefingEnviadoEm: null,
  },
  oportunidade: { id: 1, empresa: "Usinagem Alfa", contato: "Ana", servico: "climatizacao", closerId: 2, situacao: "diagnostica_marcada" },
  respostas: {},
  anotacoes: [],
  pendencias: [],
};

function api(extra: Record<string, unknown> = {}) {
  return fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes/5": { corpo: FICHA },
    "POST /api/reunioes/5/iniciar": { corpo: FICHA.reuniao },
    ...extra,
  } as never);
}

async function abrirPainel() {
  abrir("/reunioes/5/diagnostica");
  return screen.findByRole("main", { name: "Painel da diagnóstica" });
}

test("mostra uma pergunta por vez e as setas navegam", async () => {
  api();
  await abrirPainel();
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(DIAGNOSTICA.abertura[0].titulo);
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  expect(screen.getByText(DIAGNOSTICA.blocos[0].perguntas[0].texto)).toBeInTheDocument();
  await userEvent.keyboard("{ArrowLeft}");
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(DIAGNOSTICA.abertura[1].titulo);
});

test("N abre a anotação; enquanto digita, N e setas não fazem nada", async () => {
  api();
  await abrirPainel();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await userEvent.keyboard("n");
  const campo = screen.getByRole("textbox", { name: "Anotação" });
  expect(campo).toHaveFocus();
  await userEvent.type(campo, "No galpão{ArrowRight}n");
  expect(campo).toHaveValue("No galpãon");
  expect(screen.getByText(DIAGNOSTICA.blocos[0].perguntas[0].texto)).toBeInTheDocument();
});

test("anotação técnica aparece com o minuto", async () => {
  api();
  await abrirPainel();
  await userEvent.keyboard("n");
  await userEvent.click(screen.getByRole("button", { name: "Técnico" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Anotação" }), "Pé-direito de 9 m{Enter}");
  const lista = screen.getByRole("list", { name: "Anotações" });
  expect(lista).toHaveTextContent("Técnico");
  expect(lista).toHaveTextContent("Pé-direito de 9 m");
  expect(lista).toHaveTextContent(/\d+ min/);
});

test("sair do painel sem encerrar não chama o encerrar", async () => {
  const falso = api({ "GET /api/reunioes": { corpo: [] } });
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Sair do painel" }));
  expect(window.location.pathname).toBe("/reunioes");
  expect(falso.mock.calls.some(([url]) => String(url).includes("/encerrar"))).toBe(false);
});

test("fechamento exige o resultado e manda a proposta marcada", async () => {
  let enviado: unknown;
  api({
    "POST /api/reunioes/5/encerrar": (init: RequestInit) => {
      enviado = JSON.parse(String(init.body));
      return { corpo: { ...FICHA.reuniao, situacao: "concluida" } };
    },
    "PUT /api/reunioes/5/respostas": { corpo: { ok: true } },
    "GET /api/reunioes/5/briefing": { corpo: {} },
  });
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Ir para Fechamento" }));
  const form = screen.getByRole("form", { name: "Fechamento da diagnóstica" });
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar diagnóstica" }));
  expect(within(form).getByRole("alert")).toHaveTextContent("Escolha como a diagnóstica terminou.");
  await userEvent.click(within(form).getByRole("radio", { name: "Proposta marcada" }));
  await userEvent.type(within(form).getByLabelText("Data da apresentação"), "2026-11-18");
  await userEvent.type(within(form).getByLabelText("Hora"), "14:00");
  await userEvent.type(within(form).getByLabelText("Quem decide"), "Ana e o sócio");
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar diagnóstica" }));
  expect(enviado).toEqual({ resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "online", quemDecide: "Ana e o sócio" });
});

test("sem internet aparece no topo", async () => {
  api({
    "PUT /api/reunioes/5/respostas": () => {
      throw new TypeError("Failed to fetch");
    },
  });
  await abrirPainel();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await userEvent.type(screen.getByRole("textbox", { name: "Resposta" }), "Chegar a 26 °C");
  await act(async () => {
    window.dispatchEvent(new Event("online"));
  });
  expect(await screen.findByText("Sem internet · salvo neste computador")).toBeInTheDocument();
});
