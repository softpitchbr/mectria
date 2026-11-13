import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DIAGNOSTICA } from "../../compartilhado/dados/diagnostica";
import { diasDepois, hojeEmSaoPaulo } from "../../compartilhado/datas";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";
import { abrirCanal, type MensagemReuniao } from "../reuniao/canal";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";

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
  perguntasDoServico: servicosDaCarta().find((s) => s.id === "climatizacao")!.perguntas,
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
  // Não há briefing de no-show: volta para o Hoje, onde o hunter reagenda.
  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(await screen.findByRole("status")).toHaveTextContent("Reunião cancelada: o cliente não compareceu. Reagende no Hoje.");
});

test("o painel da diagnóstica usa as perguntas técnicas da ficha, sem as desativadas", async () => {
  const perguntasDoServico = [
    { id: "x-area", tipo: "curto", texto: "Qual é a área do galpão?", bloco: "parametros" },
    { id: "x-velha", tipo: "curto", texto: "Pergunta desativada?", bloco: "escopo", inativa: true },
  ];
  api({ "GET /api/reunioes/5": { corpo: { ...FICHA, perguntasDoServico } } });
  await abrirPainel();
  await userEvent.keyboard("{ArrowRight}".repeat(25));
  expect(screen.getByText("Qual é a área do galpão?")).toBeInTheDocument();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.queryByText("Pergunta desativada?")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Escopo geral");
});

// A janela da apresentação na diagnóstica (fase 9) ----------------------------------

const COM_APRESENTACAO = {
  "/api/apresentacoes": { corpo: [{ id: "diagnostica", apresentacao: { arquivo: "diagnostica.html", bytes: 10, versao: 2, enviadaEm: "2026-11-12 10:00:00", enviadaPor: "Diana" } }] },
};

/** Abre o painel com a apresentação da diagnóstica e uma janela de mentira no canal da reunião 5. */
async function comJanela() {
  api(COM_APRESENTACAO);
  const recebidas: MensagemReuniao[] = [];
  const janela = abrirCanal(5, (m) => recebidas.push(m));
  await abrirPainel();
  return { janela, recebidas };
}
const estados = (recebidas: MensagemReuniao[]) => recebidas.filter((m): m is Extract<MensagemReuniao, { tipo: "estado" }> => m.tipo === "estado");

test("com a apresentação da diagnóstica, o painel abre a janela e manda o slide do passo atual", async () => {
  const abrirJanela = vi.spyOn(window, "open").mockReturnValue(null);
  const { janela, recebidas } = await comJanela();
  await userEvent.click(await screen.findByRole("button", { name: "Abrir apresentação" }));
  expect(abrirJanela).toHaveBeenCalledWith("/apresentacao/5", "hub-apresentacao-5", expect.any(String));
  janela.enviar({ tipo: "pronta" });
  await waitFor(() =>
    expect(estados(recebidas).at(-1)).toEqual({
      tipo: "estado",
      empresa: "Usinagem Alfa",
      slide: 0,
      apresentacao: {
        tipo: "html",
        url: "/api/apresentacoes/diagnostica?v=2",
        dados: expect.objectContaining({ empresa: "Usinagem Alfa", contato: "Ana", etapa: "" }),
        interacoes: { dores: [], precoEtapa: 0, calculadora: {} },
      },
    }),
  );
  expect(await screen.findByText("Apresentação aberta")).toBeInTheDocument();
  janela.fechar();
  abrirJanela.mockRestore();
});

test("a janela aberta no meio da diagnóstica recebe o slide e a etapa do passo atual", async () => {
  const { janela, recebidas } = await comJanela();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  janela.enviar({ tipo: "pronta" });
  await waitFor(() => expect(estados(recebidas).at(-1)).toMatchObject({ slide: 2, apresentacao: { dados: { etapa: DIAGNOSTICA.blocos[0].titulo } } }));
  await userEvent.click(screen.getByRole("button", { name: "Ir para Escopo" }));
  await waitFor(() => expect(estados(recebidas).at(-1)).toMatchObject({ slide: 3 }));
  janela.enviar({ tipo: "tecla", tecla: "ArrowLeft" });
  await waitFor(() => expect(estados(recebidas).at(-1)).toMatchObject({ slide: 2, apresentacao: { dados: { etapa: "Técnico" } } }));
  janela.fechar();
});

test("sem a apresentação da diagnóstica, o painel não mostra o botão nem dá erro", async () => {
  api();
  await abrirPainel();
  await new Promise((r) => setTimeout(r, 30));
  expect(screen.queryByRole("button", { name: /Abrir apresentação/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("encerrar a diagnóstica fecha a janela", async () => {
  api({
    ...COM_APRESENTACAO,
    "POST /api/reunioes/5/encerrar": { corpo: { ...FICHA.reuniao, situacao: "concluida" } },
    "PUT /api/reunioes/5/respostas": { corpo: { ok: true } },
    "GET /api/reunioes/5/briefing": { corpo: {} },
  });
  const recebidas: MensagemReuniao[] = [];
  const janela = abrirCanal(5, (m) => recebidas.push(m));
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Ir para Fechamento" }));
  const form = screen.getByRole("form", { name: "Fechamento da diagnóstica" });
  await userEvent.click(within(form).getByRole("radio", { name: "Proposta marcada" }));
  await userEvent.type(within(form).getByLabelText("Data da apresentação"), "2026-11-18");
  await userEvent.type(within(form).getByLabelText("Hora"), "14:00");
  await userEvent.type(within(form).getByLabelText("Quem decide"), "Ana e o sócio");
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar diagnóstica" }));
  await waitFor(() => expect(recebidas).toContainEqual({ tipo: "fim" }));
  janela.fechar();
});
