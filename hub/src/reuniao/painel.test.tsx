import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dataDoD7 } from "../../compartilhado/cadencia";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import { variaveisIniciais } from "../../compartilhado/proposta";

const CLIMATIZACAO = servicosDaCarta().find((s) => s.id === "climatizacao")!;
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";
import { abrirCanal, type MensagemReuniao } from "./canal";

const REUNIAO = {
  id: 7,
  oportunidadeId: 1,
  empresa: "Usinagem Alfa",
  tipo: "proposta",
  dataHora: "2026-11-18T14:00",
  formato: "online",
  situacao: "marcada",
  closerId: 2,
  closerNome: "Vinícius Miguel",
  quemDecide: "Bia",
  iniciadaEm: null,
  encerradaEm: null,
  resultado: null,
  motivo: null,
  briefingEnviadoEm: null,
  oportunidadeSituacao: "proposta_marcada",
  desfecho: null,
};

const SESSAO = {
  reuniao: REUNIAO,
  oportunidade: { id: 1, empresa: "Usinagem Alfa", contato: "Ana", servico: "climatizacao", closerId: 2, situacao: "proposta_marcada" },
  variaveis: { ...variaveisIniciais("climatizacao", CLIMATIZACAO), valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" },
  andamento: { sala: [{ nome: "Bia", decide: true }, { nome: "Ana", decide: false }], pactos: [], tempos: {}, slide: 0 },
  anotacoes: [],
  respostasDaDiagnostica: { "c-dor": "O galpão passa de 38 °C" },
  servico: CLIMATIZACAO,
};

function api(extra: Record<string, unknown> = {}) {
  return fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes/7/proposta": { corpo: SESSAO },
    "POST /api/reunioes/7/iniciar": { corpo: { ...REUNIAO, situacao: "em_andamento", iniciadaEm: "2026-11-18 17:00:00" } },
    "PUT /api/reunioes/7/andamento": { corpo: { ok: true } },
    "POST /api/reunioes/7/anotacoes": { corpo: { ok: true } },
    ...extra,
  } as never);
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "open").mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function abrirPainel() {
  abrir("/reunioes/7/proposta");
  return screen.findByRole("main", { name: "Painel da proposta" });
}

async function comecar() {
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Começar reunião" }));
  await screen.findByText("1 de 13");
}

test("antes de começar mostra a sala com quem decide e o lembrete da janela", async () => {
  api();
  await abrirPainel();
  const sala = screen.getByRole("list", { name: "Quem está na sala" });
  expect(within(sala).getByRole("checkbox", { name: "Bia decide" })).toBeChecked();
  expect(within(sala).getByRole("checkbox", { name: "Ana decide" })).not.toBeChecked();
  expect(screen.getByText("No Meet ou no Zoom, compartilhe só a janela “Apresentação · Usinagem Alfa”.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Abrir apresentação" }));
  expect(window.open).toHaveBeenCalledWith("/apresentacao/7", "hub-apresentacao-7", expect.stringContaining("popup"));
});

test("Começar chama iniciar e mostra 1 de 13", async () => {
  const falso = api();
  await comecar();
  expect(falso.mock.calls.some(([url, init]) => String(url).endsWith("/iniciar") && (init as RequestInit).method === "POST")).toBe(true);
  expect(screen.getByText("AO VIVO")).toBeInTheDocument();
});

test("seta passa o slide e o canal manda o slide novo", async () => {
  api();
  const recebidas: MensagemReuniao[] = [];
  const janela = abrirCanal(7, (m) => recebidas.push(m));
  await comecar();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByText("2 de 13")).toBeInTheDocument();
  await vi.waitFor(() => expect(recebidas).toContainEqual({ tipo: "slide", slide: 1 }));
  janela.fechar();
});

test("a janela que abre recebe o estado inteiro", async () => {
  api();
  const recebidas: MensagemReuniao[] = [];
  const janela = abrirCanal(7, (m) => recebidas.push(m));
  await comecar();
  janela.enviar({ tipo: "pronta" });
  await vi.waitFor(() => expect(recebidas.some((m) => m.tipo === "estado" && m.empresa === "Usinagem Alfa" && m.apresentacao.tipo === "exemplo" && m.apresentacao.slides.length === 13)).toBe(true));
  janela.fechar();
});

test("pacto feito conta 1 de 6 e desfaz no segundo clique", async () => {
  api();
  await comecar();
  await userEvent.keyboard("{ArrowRight}");
  const pacto = screen.getByRole("button", { name: /^Pacto: Acordo de agenda/ });
  await userEvent.click(pacto);
  expect(pacto).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("1 de 6 pactos")).toBeInTheDocument();
  await userEvent.click(pacto);
  expect(screen.getByText("0 de 6 pactos")).toBeInTheDocument();
});

test("a fala destaca as palavras do cliente", async () => {
  api();
  await comecar();
  await userEvent.click(screen.getByRole("button", { name: "Ir para o slide 6" }));
  const fala = screen.getByRole("region", { name: "Fala" });
  expect(within(fala).getByText("o galpão passa de 38 °C").tagName).toBe("MARK");
});

test("o tempo do bloco fica vermelho quando passa do planejado", async () => {
  api({ "GET /api/reunioes/7/proposta": { corpo: { ...SESSAO, andamento: { ...SESSAO.andamento, tempos: { capa: 59 } } } } });
  await comecar();
  const tempo = screen.getByLabelText("Tempo do bloco");
  expect(tempo).toHaveTextContent("0:59 / 1:00");
  expect(tempo).not.toHaveAttribute("data-estourou");
  await act(async () => {
    await new Promise((r) => setTimeout(r, 2100));
  });
  expect(tempo).toHaveTextContent(/^1:0[12] \/ 1:00$/);
  expect(tempo).toHaveAttribute("data-estourou", "sim");
}, 10_000);

test("sem quem decide, avisa antes do preço", async () => {
  api();
  await abrirPainel();
  await userEvent.click(screen.getByRole("checkbox", { name: "Bia decide" }));
  await userEvent.click(screen.getByRole("button", { name: "Começar reunião" }));
  await screen.findByText("1 de 13");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Ir para o slide 11" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Quem decide não está na sala. Segure o preço e marque a conversa com quem decide.");
});

test("digitar o nome na sala e a anotação não passa slide", async () => {
  api();
  await comecar();
  const campo = screen.getByRole("textbox", { name: "Adicionar pessoa" });
  await userEvent.type(campo, "Rui{ArrowRight}n{ArrowLeft}o{Enter}");
  expect(screen.getByText("1 de 13")).toBeInTheDocument();
  expect(within(screen.getByRole("list", { name: "Quem está na sala" })).getByText("Ruion")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Objeções" })).not.toBeInTheDocument();
  campo.blur();
  await userEvent.keyboard("n");
  await userEvent.type(screen.getByRole("textbox", { name: "Anotação" }), "Quer começar em janeiro{ArrowRight}o");
  expect(screen.getByText("1 de 13")).toBeInTheDocument();
});

test("O abre as objeções e Esc fecha", async () => {
  api();
  await comecar();
  await userEvent.keyboard("o");
  const objecoes = screen.getByRole("region", { name: "Objeções" });
  expect(within(objecoes).getByRole("searchbox", { name: "Buscar objeção" })).toHaveFocus();
  expect(within(objecoes).getAllByRole("listitem").length).toBeGreaterThan(0);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("region", { name: "Objeções" })).not.toBeInTheDocument();
});

test("sem sinal da janela, aparece Reabrir apresentação", async () => {
  api();
  const janela = abrirCanal(7, () => {});
  await comecar();
  janela.enviar({ tipo: "viva" });
  expect(await screen.findByText("Apresentação aberta")).toBeInTheDocument();
  await act(async () => {
    await new Promise((r) => setTimeout(r, 6200));
  });
  expect(screen.getByRole("button", { name: "Reabrir apresentação" })).toBeInTheDocument();
  janela.fechar();
}, 10_000);

test("anotação fica carimbada com o slide e o minuto", async () => {
  api();
  await comecar();
  await userEvent.keyboard("{ArrowRight}n");
  await userEvent.click(screen.getByRole("button", { name: "Técnico" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Anotação" }), "Telhado de fibrocimento{Enter}");
  expect(screen.getByRole("list", { name: "Anotações" })).toHaveTextContent(/Slide 2 · \d+ min · Técnico/);
});

// Fechamento obrigatório --------------------------------------------------------

const amanha = () => {
  const d = new Date(Date.now() + 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
};

async function irParaOFechamento() {
  await comecar();
  await userEvent.click(screen.getByRole("button", { name: "Ir para o slide 13" }));
  await userEvent.click(screen.getByRole("button", { name: "Ir para o fechamento" }));
  return screen.getByRole("form", { name: "Fechamento da proposta" });
}

test("fechamento exige o resultado, a data e quem decide, e manda vai decidir", async () => {
  let enviado: unknown;
  api({
    "POST /api/reunioes/7/encerrar": (init: RequestInit) => {
      enviado = JSON.parse(String(init.body));
      return { corpo: { reuniao: { ...REUNIAO, situacao: "concluida", desfecho: "decidir" }, propostaId: 3 } };
    },
    "GET /api/followup": { corpo: [] },
  });
  const form = await irParaOFechamento();
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  expect(within(form).getByRole("alert")).toHaveTextContent("Escolha como a reunião terminou.");
  await userEvent.click(within(form).getByRole("radio", { name: "Vai decidir (data combinada)" }));
  expect(within(form).getByLabelText("Quem decide")).toHaveValue("Bia");
  expect(within(form).getByLabelText("Valor apresentado")).toHaveValue("R$ 12.500,00");
  await userEvent.clear(within(form).getByLabelText("Data da decisão"));
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  expect(within(form).getByRole("alert")).toHaveTextContent("Informe a data da decisão.");
  await userEvent.type(within(form).getByLabelText("Data da decisão"), amanha());
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  await vi.waitFor(() => expect(enviado).toEqual({ desfecho: "decidir", valor: 1250000, dataDecisao: amanha(), quemDecide: "Bia" }));
  await vi.waitFor(() => expect(window.location.pathname).toBe("/follow-up"));
});

test("vai decidir e pediu ajuste já vêm com a data da decisão no D7", async () => {
  api({ "GET /api/followup": { corpo: [] } });
  const form = await irParaOFechamento();
  const d7 = dataDoD7(hojeEmSaoPaulo());
  await userEvent.click(within(form).getByRole("radio", { name: "Vai decidir (data combinada)" }));
  expect(within(form).getByLabelText("Data da decisão")).toHaveValue(d7);
  await userEvent.click(within(form).getByRole("radio", { name: "Pediu ajuste na proposta" }));
  expect(within(form).getByLabelText("Data da decisão")).toHaveValue(d7);
});

test("perdeu pede o motivo e volta para Reuniões", async () => {
  let enviado: unknown;
  api({
    "POST /api/reunioes/7/encerrar": (init: RequestInit) => {
      enviado = JSON.parse(String(init.body));
      return { corpo: { reuniao: { ...REUNIAO, situacao: "concluida", desfecho: "perdido" }, propostaId: 3 } };
    },
    "GET /api/reunioes": { corpo: [] },
  });
  const form = await irParaOFechamento();
  await userEvent.click(within(form).getByRole("radio", { name: "Perdeu" }));
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  expect(within(form).getByRole("alert")).toHaveTextContent("Escolha o motivo.");
  await userEvent.selectOptions(within(form).getByLabelText("Motivo"), "Preço");
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  await vi.waitFor(() => expect(enviado).toEqual({ desfecho: "perdido", valor: 1250000, motivo: "Preço" }));
  await vi.waitFor(() => expect(window.location.pathname).toBe("/reunioes"));
});

test("encerrar não passa com o andamento sem salvar", async () => {
  const falso = api({
    "PUT /api/reunioes/7/andamento": () => {
      throw new TypeError("Failed to fetch");
    },
  });
  const form = await irParaOFechamento();
  await userEvent.click(within(form).getByRole("radio", { name: "Fechou" }));
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  expect(await within(form).findByRole("alert")).toHaveTextContent("Ainda há dados sem salvar no servidor. Confira a internet e tente de novo.");
  expect(falso.mock.calls.some(([url]) => String(url).includes("/encerrar"))).toBe(false);
});

test("com o fechamento aberto, o relógio para e o tempo do último slide não sobe", async () => {
  api();
  await irParaOFechamento();
  const tempoDoFechamento = () => JSON.parse(localStorage.getItem("hub-proposta-7")!).andamento.tempos.fechamento ?? 0;
  const antes = tempoDoFechamento();
  await act(async () => {
    await new Promise((r) => setTimeout(r, 2100));
  });
  expect(tempoDoFechamento()).toBe(antes);
}, 10_000);

test("o relógio não troca o Salvo por Salvando", async () => {
  api();
  await comecar();
  await act(async () => {
    await new Promise((r) => setTimeout(r, 1100));
  });
  await vi.waitFor(() => expect(screen.getAllByRole("status")[0]).toHaveTextContent("Salvo"));
  await act(async () => {
    await new Promise((r) => setTimeout(r, 1100));
  });
  expect(screen.getAllByRole("status")[0]).toHaveTextContent("Salvo");
}, 10_000);

test("a mesma reunião aberta em outra aba fica só com o aviso, sem relógio e sem responder à janela", async () => {
  vi.stubGlobal("navigator", Object.assign(Object.create(navigator), { locks: { request: async (_n: string, _o: unknown, f: (l: null) => unknown) => f(null) } }));
  const falso = api();
  const recebidas: MensagemReuniao[] = [];
  const janela = abrirCanal(7, (m) => recebidas.push(m));
  abrir("/reunioes/7/proposta");
  expect(await screen.findByText("Esta reunião já está aberta em outra aba. Continue por lá.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Começar reunião" })).not.toBeInTheDocument();
  janela.enviar({ tipo: "pronta" });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 300));
  });
  expect(recebidas.filter((m) => m.tipo === "estado")).toEqual([]);
  expect(falso.mock.calls.some(([url]) => String(url).endsWith("/andamento"))).toBe(false);
  janela.fechar();
  vi.unstubAllGlobals();
});

test("fechou pede o valor fechado, que começa com o apresentado", async () => {
  let enviado: unknown;
  api({
    "POST /api/reunioes/7/encerrar": (init: RequestInit) => {
      enviado = JSON.parse(String(init.body));
      return { corpo: { reuniao: { ...REUNIAO, situacao: "concluida", desfecho: "ganho" }, propostaId: 3 } };
    },
    "GET /api/reunioes": { corpo: [] },
  });
  const form = await irParaOFechamento();
  await userEvent.click(within(form).getByRole("radio", { name: "Fechou" }));
  const fechado = within(form).getByLabelText("Valor fechado");
  expect(fechado).toHaveValue("R$ 12.500,00");
  await userEvent.clear(fechado);
  await userEvent.type(fechado, "11.250,00");
  await userEvent.click(within(form).getByRole("button", { name: "Encerrar reunião" }));
  await vi.waitFor(() => expect(enviado).toEqual({ desfecho: "ganho", valor: 1250000, valorFechado: 1125000 }));
});

test("depois de marcar quem decide, as setas continuam passando o slide", async () => {
  api();
  await comecar();
  await userEvent.click(screen.getByRole("checkbox", { name: "Ana decide" }));
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByText("2 de 13")).toBeInTheDocument();
});

// Apresentação em HTML (fase 8) -------------------------------------------------

const ROTEIRO = [
  { id: "abre", titulo: "Bem-vindos", fala: "Comece pela agenda, {contato}.", pacto: "agenda" as const, tempo: 2 },
  { id: "preco", titulo: "Investimento", fala: "Revele o preço em etapas.", pacto: null, tempo: 3 },
  { id: "fim", titulo: "Próximos passos", fala: "Combine a decisão.", pacto: null, tempo: 2 },
];
const COM_HTML = {
  ...SESSAO,
  servico: { ...CLIMATIZACAO, roteiro: ROTEIRO, apresentacao: { arquivo: "c.html", bytes: 10, versao: 3, enviadaEm: "2026-11-11 10:00:00", enviadaPor: "Diana" } },
};
const PRONTA = {
  mectria: 1 as const,
  tipo: "pronta" as const,
  slides: 3,
  acoes: [{ slide: 1, id: "revelar-preco", rotulo: "Revelar o preço" }],
  campos: [{ slide: 1, id: "horas-paradas", rotulo: "Horas paradas por mês" }],
};

/** Começa a reunião com a apresentação própria e uma janela de mentira, que já avisou que a apresentação está pronta. */
async function comecarComHtml(sessao: unknown = COM_HTML, pronta: unknown = PRONTA) {
  api({ "GET /api/reunioes/7/proposta": { corpo: sessao } });
  const recebidas: MensagemReuniao[] = [];
  const janela = abrirCanal(7, (m) => recebidas.push(m));
  await abrirPainel();
  await userEvent.click(screen.getByRole("button", { name: "Começar reunião" }));
  janela.enviar({ tipo: "pronta" });
  janela.enviar({ tipo: "apresentacao", mensagem: pronta as never });
  return { janela, recebidas };
}

test("com apresentação própria, o painel usa o roteiro do serviço (fala e número de slides) e manda o estado html", async () => {
  const { janela, recebidas } = await comecarComHtml();
  expect(await screen.findByText("1 de 3")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Fala" })).toHaveTextContent("Comece pela agenda, Ana.");
  await vi.waitFor(() =>
    expect(recebidas).toContainEqual({
      tipo: "estado",
      empresa: "Usinagem Alfa",
      slide: 0,
      apresentacao: {
        tipo: "html",
        url: "/api/servicos/climatizacao/apresentacao?v=3",
        dados: expect.objectContaining({ empresa: "Usinagem Alfa", valorCentavos: "1250000", doresDoServico: CLIMATIZACAO.dores.join("\n") }),
        interacoes: { dores: [], precoEtapa: 0, calculadora: {} },
      },
    }),
  );
  expect(within(screen.getByRole("region", { name: "Próximo slide" })).getByText("Investimento")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: /^Slide: / })).not.toBeInTheDocument();
  janela.fechar();
});

test("a pronta com 12 slides para um roteiro de 13 mostra o alerta só no painel", async () => {
  const sessao = { ...COM_HTML, servico: { ...COM_HTML.servico, roteiro: null } };
  const { janela } = await comecarComHtml(sessao, { ...PRONTA, slides: 12 });
  expect(await screen.findByText("1 de 13")).toBeInTheDocument();
  expect(await screen.findByText("A apresentação tem 12 slides e o roteiro tem 13. Ajuste o roteiro em Serviços.")).toBeInTheDocument();
  janela.fechar();
});

test("o botão Revelar o preço manda acionar revelar-preco", async () => {
  const { janela, recebidas } = await comecarComHtml();
  await screen.findByText("1 de 3");
  expect(screen.queryByRole("button", { name: "Revelar o preço" })).not.toBeInTheDocument();
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.click(await screen.findByRole("button", { name: "Revelar o preço" }));
  await vi.waitFor(() => expect(recebidas).toContainEqual({ tipo: "acionar", acao: "revelar-preco" }));
  janela.fechar();
});

test("o evento da dor aparece em Na apresentação e vai no próximo andamento salvo", async () => {
  const { janela } = await comecarComHtml();
  await screen.findByText("1 de 3");
  janela.enviar({ tipo: "apresentacao", mensagem: { mectria: 1, tipo: "evento", evento: "dor", valor: "O galpão é muito quente", marcada: true } });
  janela.enviar({ tipo: "apresentacao", mensagem: { mectria: 1, tipo: "evento", evento: "preco", etapa: 2 } });
  const resumo = await screen.findByRole("region", { name: "Na apresentação" });
  await vi.waitFor(() => expect(resumo).toHaveTextContent("O galpão é muito quente"));
  expect(resumo).toHaveTextContent("Preço revelado até a etapa 2");
  await vi.waitFor(() =>
    expect(JSON.parse(localStorage.getItem("hub-proposta-7")!).andamento.interacoes).toEqual({ dores: ["O galpão é muito quente"], precoEtapa: 2, calculadora: {} }),
  );
  janela.fechar();
});

test("o campo Horas paradas manda calcular com o número", async () => {
  const { janela, recebidas } = await comecarComHtml();
  await screen.findByText("1 de 3");
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.type(await screen.findByLabelText("Horas paradas por mês"), "12");
  await vi.waitFor(() => expect(recebidas).toContainEqual({ tipo: "calcular", valores: { "horas-paradas": 12 } }));
  janela.enviar({ tipo: "apresentacao", mensagem: { mectria: 1, tipo: "evento", evento: "calculadora", valores: { "horas-paradas": 12 } } });
  await vi.waitFor(() => expect(screen.getByRole("region", { name: "Na apresentação" })).toHaveTextContent("Horas paradas por mês: 12"));
  expect(screen.getByLabelText("Horas paradas por mês")).toHaveValue(12);
  janela.fechar();
});

test("sem apresentação própria, o painel continua com os 13 slides de exemplo e a miniatura", async () => {
  api();
  await comecar();
  expect(within(screen.getByRole("region", { name: "Próximo slide" })).getByRole("region", { name: /^Slide: / })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Na apresentação" })).not.toBeInTheDocument();
});

test("andamento salvo num slide além do roteiro (roteiro encurtado) abre no último slide, sem quebrar", async () => {
  const sessao = { ...COM_HTML, reuniao: { ...REUNIAO, situacao: "em_andamento", iniciadaEm: "2026-11-18 17:00:00" }, andamento: { ...COM_HTML.andamento, slide: 9, tempos: { velho: 30 } } };
  api({ "GET /api/reunioes/7/proposta": { corpo: sessao } });
  await abrirPainel();
  expect(await screen.findByText("3 de 3")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Próximos passos" })).toBeInTheDocument();
  await act(async () => {
    await new Promise((r) => setTimeout(r, 1100));
  });
  expect(screen.getByText("3 de 3")).toBeInTheDocument();
});
