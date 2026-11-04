import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, NUMEROS_VAZIOS, PESSOAS } from "../../teste/ajuda";

const ROTINA_VAZIA = { dia: "2026-11-09", itens: [], feitos: 0, total: 0 };
const contagem = (total: number, naoAtendeu: number, atendeu: number, marcou = 0, conexao = 0) => ({
  total,
  naoAtendeu,
  atendeu,
  marcou,
  meta: 2,
  conexao,
  conexoesSemana: conexao + marcou,
  metaConexoesSemana: 8,
});

test("hunter registra ligações pelo teclado no bloco em foco", async () => {
  const enviados: string[] = [];
  let n = 0;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "GET /api/ligacoes": { corpo: contagem(0, 0, 0) },
    "POST /api/ligacoes": (init) => {
      enviados.push(JSON.parse(String(init?.body)).resultado);
      n++;
      return { corpo: n === 1 ? contagem(1, 1, 0) : n === 2 ? contagem(2, 1, 1) : contagem(3, 1, 1, 0, 1) };
    },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/reunioes": { corpo: [] },
  });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Começar o bloco" }));
  const foco = screen.getByRole("dialog", { name: "Bloco de ligações" });
  await userEvent.keyboard("1");
  await within(foco).findByText("1 sem resposta");
  await userEvent.keyboard("2");
  await userEvent.keyboard("3");
  expect(enviados).toEqual(["nao_atendeu", "atendeu", "conexao"]);
  await vi.waitFor(() => expect(within(foco).getByRole("meter", { name: "Conexões da semana" })).toHaveAttribute("aria-valuenow", "1"));
  expect(within(foco).getByRole("meter", { name: "Conexões da semana" })).toHaveAttribute("aria-valuemax", "8");
  expect(foco).toHaveTextContent("3 ligações hoje");
  expect(within(foco).getByText("1 sem resposta")).toBeInTheDocument();
});

test("tecla 4 abre marcar diagnóstica e copiar cold message leva o nome do hunter", async () => {
  const escrever = vi.fn(async () => undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText: escrever }, configurable: true });
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "GET /api/ligacoes": { corpo: contagem(0, 0, 0) },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/reunioes": { corpo: [] },
    "GET /api/closers": { corpo: [] },
  });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Começar o bloco" }));
  const foco = screen.getByRole("dialog", { name: "Bloco de ligações" });
  expect(within(foco).getByRole("list", { name: "Roteiro da ligação" })).toHaveTextContent("Me dá só 30 segundos?");
  await userEvent.click(within(foco).getByRole("button", { name: "Copiar cold message" }));
  expect(escrever).toHaveBeenCalledWith(expect.stringContaining("Aqui é o Hugo, da MecTRIA."));
  await userEvent.keyboard("4");
  expect(screen.getByRole("form", { name: "Marcar diagnóstica" })).toBeInTheDocument();
});

test("marcar diagnóstica cria a oportunidade e conta a ligação", async () => {
  let oportunidade: Record<string, unknown> | undefined;
  const ligacoes: string[] = [];
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "GET /api/ligacoes": { corpo: contagem(0, 0, 0) },
    "POST /api/ligacoes": (init) => {
      ligacoes.push(JSON.parse(String(init?.body)).resultado);
      return { corpo: contagem(1, 0, 0, 1) };
    },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/reunioes": { corpo: [] },
    "GET /api/closers": { corpo: [{ id: 2, nome: "Vinícius Miguel" }] },
    "POST /api/oportunidades": (init) => {
      oportunidade = JSON.parse(String(init?.body));
      return { status: 201, corpo: { oportunidade: {}, reuniao: { dataHora: "2026-11-10T14:00" } } };
    },
  });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Começar o bloco" }));
  await userEvent.click(screen.getByRole("button", { name: /Marcou diagnóstica/ }));
  const form = screen.getByRole("form", { name: "Marcar diagnóstica" });
  await userEvent.type(within(form).getByLabelText("Empresa"), "Usinagem Alfa");
  await userEvent.type(within(form).getByLabelText("Contato"), "Ana Souza");
  await userEvent.type(within(form).getByLabelText("Telefone"), "34999990000");
  await userEvent.selectOptions(within(form).getByLabelText("Serviço"), "climatizacao");
  await within(form).findByRole("option", { name: "Vinícius Miguel" });
  await userEvent.selectOptions(within(form).getByLabelText("Closer"), "2");
  await userEvent.type(within(form).getByLabelText("Data"), "2026-11-10");
  await userEvent.type(within(form).getByLabelText("Hora"), "14:00");
  await userEvent.type(within(form).getByLabelText("Observações"), "O sócio decide; prefere WhatsApp.");
  await userEvent.click(within(form).getByRole("button", { name: "Marcar diagnóstica" }));
  expect(oportunidade).toMatchObject({
    empresa: "Usinagem Alfa",
    servico: "climatizacao",
    closerId: 2,
    dataHora: "2026-11-10T14:00",
    formato: "online",
    observacoes: "O sócio decide; prefere WhatsApp.",
  });
  expect(ligacoes).toEqual(["marcou"]);
  expect(await screen.findByRole("status")).toHaveTextContent("Diagnóstica marcada com Vinícius Miguel para Ter, 10/11 às 14:00.");
});

test("closer vê a próxima reunião com a contagem", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T11:45:00-03:00"));
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes": {
      corpo: [
        { id: 1, oportunidadeId: 1, empresa: "Já passou", tipo: "diagnostica", dataHora: "2026-11-09T09:00", formato: "online", situacao: "marcada", closerId: 2, closerNome: "Vinícius Miguel", oportunidadeSituacao: "diagnostica_marcada" },
        { id: 2, oportunidadeId: 2, empresa: "Usinagem Alfa", tipo: "diagnostica", dataHora: "2026-11-09T14:00", formato: "online", situacao: "marcada", closerId: 2, closerNome: "Vinícius Miguel", oportunidadeSituacao: "diagnostica_marcada" },
      ],
    },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/followup": { corpo: [] },
    "GET /api/numeros/mes": { corpo: { propostas: 3, ganhas: 1 } },
  });
  abrir("/");
  const cartao = (await screen.findByText("Usinagem Alfa")).closest("section") as HTMLElement;
  expect(within(cartao).getByText("faltam 2 h 15 min")).toBeInTheDocument();
  expect(within(cartao).getByRole("button", { name: "Iniciar reunião" })).toBeEnabled();
  expect(screen.queryByText("Já passou")).not.toBeInTheDocument();
  expect(await screen.findByRole("region", { name: "Este mês" })).toHaveTextContent("3");
});

const reuniaoDoCloser = (id: number, empresa: string, dataHora: string, situacao = "marcada", oportunidadeSituacao = "diagnostica_marcada") => ({
  id, oportunidadeId: id, empresa, tipo: "diagnostica", dataHora, formato: "online", situacao, closerId: 2, closerNome: "Vinícius Miguel", oportunidadeSituacao,
});

function hojeDoCloser(reunioes: unknown[]) {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes": { corpo: reunioes },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/followup": { corpo: [] },
    "GET /api/numeros/mes": { corpo: { propostas: 0, ganhas: 0 } },
  });
  abrir("/");
}

test("a reunião que acabou de começar continua como a próxima; concluídas e as que já passaram da diagnóstica ficam de fora", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T14:10:00-03:00"));
  hojeDoCloser([
    reuniaoDoCloser(1, "Usinagem Alfa", "2026-11-09T14:00"),
    reuniaoDoCloser(2, "Concluída antes", "2026-11-09T15:00", "concluida", "proposta_marcada"),
    reuniaoDoCloser(3, "Já tem proposta", "2026-11-09T16:00", "marcada", "em_followup"),
    reuniaoDoCloser(4, "Metalúrgica Beta", "2026-11-10T10:00"),
  ]);
  const cartao = (await screen.findByText("Usinagem Alfa")).closest("section") as HTMLElement;
  expect(within(cartao).getByText("começou")).toBeInTheDocument();
  expect(within(cartao).getByRole("button", { name: "Iniciar reunião" })).toBeEnabled();
  vi.useRealTimers();
});

test("reunião em andamento aparece com Continuar, mesmo passada a primeira hora", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T15:30:00-03:00"));
  hojeDoCloser([reuniaoDoCloser(1, "Usinagem Alfa", "2026-11-09T14:00", "em_andamento"), reuniaoDoCloser(4, "Metalúrgica Beta", "2026-11-10T10:00")]);
  const cartao = (await screen.findByText("Usinagem Alfa")).closest("section") as HTMLElement;
  await userEvent.click(within(cartao).getByRole("button", { name: "Continuar reunião" }));
  expect(window.location.pathname).toBe("/reunioes/1/diagnostica");
  vi.useRealTimers();
});

test("o Hoje mostra pactos por reunião, com uma casa decimal", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes": { corpo: [] },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/followup": { corpo: [] },
    "GET /api/numeros/mes": { corpo: { propostas: 3, ganhas: 1, pactosPorReuniao: 4.5 } },
  });
  abrir("/");
  const mes = await screen.findByRole("region", { name: "Este mês" });
  await vi.waitFor(() => expect(mes).toHaveTextContent("4,5"));
});

test("Iniciar reunião da proposta leva ao painel da proposta", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T11:45:00-03:00"));
  hojeDoCloser([{ ...reuniaoDoCloser(4, "Plásticos Delta", "2026-11-09T14:00", "marcada", "proposta_marcada"), tipo: "proposta" }]);
  const cartao = (await screen.findByText("Plásticos Delta")).closest("section") as HTMLElement;
  await userEvent.click(within(cartao).getByRole("button", { name: "Iniciar reunião" }));
  expect(window.location.pathname).toBe("/reunioes/4/proposta");
  vi.useRealTimers();
});

test("o Hoje do closer busca a agenda desde uma semana atrás, para achar a reunião começada e não fechada", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T11:45:00-03:00"));
  hojeDoCloser([{ ...reuniaoDoCloser(4, "Forja Ontem", "2026-11-08T14:00", "em_andamento", "proposta_marcada"), tipo: "proposta" }]);
  const cartao = (await screen.findByText("Forja Ontem")).closest("section") as HTMLElement;
  expect(within(cartao).getByRole("button", { name: "Continuar reunião" })).toBeInTheDocument();
  const chamadas = (fetch as unknown as { mock: { calls: [string][] } }).mock.calls.map(([url]) => String(url));
  expect(chamadas).toContain("/api/reunioes?de=2026-11-02&ate=2026-11-15");
  vi.useRealTimers();
});

test("diretor vê atrasados por pessoa em ordem", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/time/resumo": {
      corpo: {
        pessoas: [
          { pessoa: { id: 3, nome: "Clara Closer", cargo: "closer" }, rotina: { feitos: 1, total: 4 }, atrasados: 1 },
          { pessoa: { id: 2, nome: "Carlos Closer", cargo: "closer" }, rotina: { feitos: 4, total: 4 }, atrasados: 3 },
          { pessoa: { id: 1, nome: "Hugo Hunter", cargo: "hunter" }, rotina: { feitos: 0, total: 3 }, atrasados: 0 },
        ],
        reunioesDaSemana: [
          { id: 9, oportunidadeId: 9, empresa: "Agro Gama", tipo: "proposta", dataHora: "2026-11-11T10:00", formato: "presencial", situacao: "marcada", closerId: 2, closerNome: "Carlos Closer" },
        ],
      },
    },
  });
  abrir("/");
  const atrasados = await screen.findByRole("list", { name: "Follow-ups atrasados por pessoa" });
  expect(within(atrasados).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["Carlos · 3", "Clara · 1"]);
  expect(screen.getByRole("list", { name: "Reuniões da semana" })).toHaveTextContent("Agro Gama");
});

test("Hoje do diretor mostra conversão e valor vendido do mês", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/time/resumo": { corpo: { pessoas: [], reunioesDaSemana: [] } },
    "GET /api/time/numeros": { corpo: { ...NUMEROS_VAZIOS, propostas: 4, ganhas: 1, perdidas: 1, conversao: 0.5, valorVendido: 1250000 } },
  });
  abrir("/");
  const mes = await screen.findByRole("region", { name: "Este mês" });
  await within(mes).findByText("50%");
  expect(mes).toHaveTextContent("R$ 12.500,00");
  expect(mes).toHaveTextContent("Propostas4");
  expect(mes).toHaveTextContent("Fechadas1");
});

test("Hoje de Projetos mostra os briefings novos e as pendências abertas", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.projetos },
    "GET /api/briefings": {
      corpo: [{ id: 5, oportunidadeId: 1, empresa: "Usinagem Alfa", tipo: "diagnostica", dataHora: "2026-11-03T10:00", briefingEnviadoEm: "2026-11-03 15:00:00" }],
    },
    "GET /api/pendencias": {
      corpo: [
        {
          pendencia: { id: 7, oportunidadeId: 1, texto: "Qual a vazão?", prazo: "2026-11-04", situacao: "aberta", resposta: null },
          empresa: "Usinagem Alfa",
          reuniaoId: 5,
          estado: "atrasada",
        },
      ],
    },
  } as never);
  abrir("/");
  expect(await screen.findByRole("list", { name: "Briefings novos" })).toHaveTextContent("Usinagem Alfa");
  expect(screen.getByRole("list", { name: "Pendências abertas" })).toHaveTextContent("Qual a vazão?");
  expect(screen.getByRole("link", { name: "Responder em Briefings" })).toHaveAttribute("href", "/briefings");
});

test("segurar a tecla no bloco não registra várias ligações", async () => {
  const enviados: string[] = [];
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "GET /api/ligacoes": { corpo: contagem(0, 0, 0) },
    "POST /api/ligacoes": (init) => {
      enviados.push(JSON.parse(String(init?.body)).resultado);
      return { corpo: contagem(1, 1, 0) };
    },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/reunioes": { corpo: [] },
  });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Começar o bloco" }));
  await userEvent.keyboard("{1>5/}"); // segura o 1: um keydown normal e quatro repetidos
  await screen.findByText("1 sem resposta");
  expect(enviados).toEqual(["nao_atendeu"]);
});

test("o Iniciar reunião do Hoje leva ao painel da diagnóstica", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T11:45:00-03:00"));
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes": {
      corpo: [{ id: 2, oportunidadeId: 2, empresa: "Usinagem Alfa", tipo: "diagnostica", dataHora: "2026-11-09T14:00", formato: "online", situacao: "marcada", closerId: 2, closerNome: "Vinícius Miguel", oportunidadeSituacao: "diagnostica_marcada" }],
    },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/followup": { corpo: [] },
    "GET /api/numeros/mes": { corpo: { propostas: 0, ganhas: 0 } },
  });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Iniciar reunião" }));
  expect(window.location.pathname).toBe("/reunioes/2/diagnostica");
});

test("o hunter tem Iniciar na diagnóstica que marcou para hoje", async () => {
  const hoje = hojeEmSaoPaulo();
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "GET /api/ligacoes": { corpo: { dia: hoje, naoAtendeu: 0, atendeu: 0, marcou: 0, total: 0 } },
    "GET /api/rotina": { corpo: ROTINA_VAZIA },
    "GET /api/reunioes": {
      corpo: [
        { id: 7, oportunidadeId: 1, empresa: "Usinagem Alfa", tipo: "diagnostica", dataHora: `${hoje}T15:00`, formato: "online", situacao: "marcada", closerId: 2, closerNome: "Carlos Closer", oportunidadeSituacao: "diagnostica_marcada" },
        { id: 8, oportunidadeId: 2, empresa: "Agro Gama", tipo: "diagnostica", dataHora: "2099-01-05T10:00", formato: "online", situacao: "marcada", closerId: 2, closerNome: "Carlos Closer", oportunidadeSituacao: "diagnostica_marcada" },
      ],
    },
  } as never);
  abrir("/");
  const lista = await screen.findByRole("list", { name: "Diagnósticas que marquei" });
  expect(within(lista).getByRole("link", { name: "Iniciar a diagnóstica de Usinagem Alfa" })).toHaveAttribute("href", "/reunioes/7/diagnostica");
  expect(within(lista).queryByRole("link", { name: "Iniciar a diagnóstica de Agro Gama" })).toBeNull();
});
