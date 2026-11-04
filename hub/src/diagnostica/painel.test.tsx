import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DIAGNOSTICA } from "../../compartilhado/dados/diagnostica";
import { diasDepois, hojeEmSaoPaulo } from "../../compartilhado/datas";
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

// Cada teste começa sem rascunho: a reunião 5 é a mesma em todos.
beforeEach(() => localStorage.clear());

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
  await waitFor(() => expect(enviado).toEqual({ resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "online", quemDecide: "Ana e o sócio" }));
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

test("encerrar não passa enquanto há respostas sem salvar no servidor", async () => {
  const falso = api({
    "PUT /api/reunioes/5/respostas": () => {
      throw new TypeError("Failed to fetch");
    },
  });
  await abrirPainel();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await userEvent.type(screen.getByRole("textbox", { name: "Resposta" }), "Chegar a 26 °C");
  await userEvent.click(screen.getByRole("button", { name: "Ir para Fechamento" }));
  const form = screen.getByRole("form", { name: "Fechamento da diagnóstica" });
  await userEvent.click(within(form).getByRole("radio", { name: "Não qualificou" }));
  await userEvent.selectOptions(within(form).getByLabelText("Motivo"), "Sem orçamento");
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar diagnóstica" }));
  expect(await within(form).findByRole("alert")).toHaveTextContent("Ainda há respostas sem salvar no servidor. Confira a internet e tente de novo.");
  expect(falso.mock.calls.some(([url]) => String(url).includes("/encerrar"))).toBe(false);
});

test("o campo da anotação aceita até 2.000 caracteres, o mesmo limite do servidor", async () => {
  api();
  await abrirPainel();
  await userEvent.keyboard("n");
  expect(screen.getByRole("textbox", { name: "Anotação" })).toHaveAttribute("maxLength", "2000");
});

test("não qualificou pede o mês para retomar e manda retomarEm", async () => {
  let enviado: unknown;
  api({
    "POST /api/reunioes/5/encerrar": (init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...FICHA.reuniao, situacao: "concluida", resultado: "nao_qualificou" } };
    },
  });
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Ir para Fechamento" }));
  const form = screen.getByRole("form", { name: "Fechamento da diagnóstica" });
  await userEvent.click(within(form).getByRole("radio", { name: "Não qualificou" }));
  await userEvent.selectOptions(within(form).getByLabelText("Motivo"), "Sem orçamento");
  const proximoMes = `${diasDepois(`${hojeEmSaoPaulo().slice(0, 7)}-01`, 32).slice(0, 7)}-01`;
  await userEvent.selectOptions(within(form).getByRole("combobox", { name: "Retomar em" }), proximoMes);
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar diagnóstica" }));
  await waitFor(() => expect(enviado).toEqual({ resultado: "nao_qualificou", motivo: "Sem orçamento", retomarEm: proximoMes }));
});

test("o painel mostra as observações de quem marcou", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes/5": { corpo: { ...FICHA, reuniao: { ...FICHA.reuniao, observacoes: "O sócio decide; prefere WhatsApp." } } },
    "POST /api/reunioes/5/iniciar": { corpo: FICHA.reuniao },
  } as never);
  await abrirPainel();
  expect(screen.getByRole("note", { name: "Observações de quem marcou" })).toHaveTextContent("O sócio decide; prefere WhatsApp.");
});

test("o fechamento manda nao_compareceu", async () => {
  let enviado: unknown;
  api({
    "POST /api/reunioes/5/encerrar": (init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...FICHA.reuniao, situacao: "cancelada", motivo: "Cliente não compareceu" } };
    },
  });
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Ir para Fechamento" }));
  const form = screen.getByRole("form", { name: "Fechamento da diagnóstica" });
  await userEvent.click(within(form).getByRole("radio", { name: "Cliente não compareceu" }));
  expect(within(form).getByText(/volta para o hunter reagendar/)).toBeInTheDocument();
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar diagnóstica" }));
  await waitFor(() => expect(enviado).toEqual({ resultado: "nao_compareceu" }));
});
