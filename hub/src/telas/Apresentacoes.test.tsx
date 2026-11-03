import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { variaveisIniciais } from "../../compartilhado/proposta";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const R = (id: number, empresa: string, tipo: string, oportunidadeSituacao: string) => ({
  id, oportunidadeId: id, empresa, tipo, dataHora: "2099-11-18T14:00", formato: "online", situacao: "marcada", closerId: 2, closerNome: "Vinícius Miguel",
  quemDecide: "Bia", iniciadaEm: null, encerradaEm: null, resultado: null, motivo: null, briefingEnviadoEm: null, oportunidadeSituacao, desfecho: null,
});

const SESSAO = {
  reuniao: R(7, "Usinagem Alfa", "proposta", "proposta_marcada"),
  oportunidade: { id: 7, empresa: "Usinagem Alfa", contato: "Ana", servico: "climatizacao", closerId: 2, situacao: "proposta_marcada" },
  variaveis: variaveisIniciais("climatizacao"),
  andamento: { sala: [], pactos: [], tempos: {}, slide: 0 },
  anotacoes: [],
  respostasDaDiagnostica: {},
};

function api(extra: Record<string, unknown> = {}) {
  return fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes": {
      corpo: [R(7, "Usinagem Alfa", "proposta", "proposta_marcada"), R(8, "Agro Gama", "diagnostica", "diagnostica_marcada"), R(9, "Já Registrada", "proposta", "em_followup")],
    },
    "GET /api/reunioes/7/proposta": { corpo: SESSAO },
    ...extra,
  } as never);
}

test("lista as propostas para preparar e abre o foco com as variáveis", async () => {
  api();
  abrir("/apresentacoes");
  const lista = await screen.findByRole("list", { name: "Propostas para preparar" });
  expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
  await userEvent.click(within(lista).getByRole("button", { name: "Preparar" }));
  const foco = await screen.findByRole("dialog", { name: "Preparar a proposta · Usinagem Alfa" });
  expect(within(foco).getByLabelText("Escopo incluído")).toHaveValue(SESSAO.variaveis.escopo);
  expect(within(foco).getByText("Falta para a reunião: Valor, Prazo, Time")).toBeInTheDocument();
});

test("salvar manda as variáveis com o valor em centavos e avisa", async () => {
  let enviado: unknown;
  api({
    "PUT /api/reunioes/7/variaveis": (init: RequestInit) => {
      enviado = JSON.parse(String(init.body));
      return { corpo: { ok: true } };
    },
  });
  abrir("/apresentacoes");
  await userEvent.click(await screen.findByRole("button", { name: "Preparar" }));
  const foco = await screen.findByRole("dialog", { name: "Preparar a proposta · Usinagem Alfa" });
  await userEvent.type(within(foco).getByLabelText("Valor"), "12.500,00");
  await userEvent.type(within(foco).getByLabelText("Prazo"), "45 dias");
  await userEvent.type(within(foco).getByLabelText("Time"), "Rui e Bia");
  expect(within(foco).getByText("Pronta para a reunião.")).toBeInTheDocument();
  await userEvent.click(within(foco).getByRole("button", { name: "Salvar" }));
  await vi.waitFor(() => expect(enviado).toEqual({ ...SESSAO.variaveis, valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Proposta de Usinagem Alfa salva.");
});

test("valor que não se lê não salva", async () => {
  const falso = api();
  abrir("/apresentacoes");
  await userEvent.click(await screen.findByRole("button", { name: "Preparar" }));
  const foco = await screen.findByRole("dialog", { name: "Preparar a proposta · Usinagem Alfa" });
  await userEvent.type(within(foco).getByLabelText("Valor"), "doze mil");
  await userEvent.click(within(foco).getByRole("button", { name: "Salvar" }));
  expect(within(foco).getByRole("alert")).toHaveTextContent("Confira o valor: use o formato 12.500,00.");
  expect(falso.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === "PUT")).toBe(false);
});

test("o catálogo mostra os 13 slides de exemplo e o que ainda vem", async () => {
  api();
  abrir("/apresentacoes");
  const catalogo = await screen.findByRole("region", { name: "Catálogo" });
  expect(within(catalogo).getAllByRole("region", { name: /^Slide: / })).toHaveLength(13);
  expect(within(catalogo).getAllByText("Chega com o subprojeto das apresentações.")).toHaveLength(3);
});

test("o hunter não vê Apresentações", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.hunter } });
  abrir("/apresentacoes");
  expect(await screen.findByText("Seu acesso não inclui Apresentações. Fale com o diretor comercial da MecTRIA.")).toBeInTheDocument();
});
