import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { diasDepois, hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { abrir, fingirApi, PESSOAS } from "../../teste/ajuda";

const ITEM = {
  oportunidade: {
    id: 1, empresa: "Caldeiraria Sul", contato: "Ana", telefone: "", email: "", cidade: "", segmento: "", origem: "cold call", servico: "climatizacao",
    hunterId: null, closerId: 2, closerNome: "Vinícius Miguel", situacao: "nutricao", motivoPerda: null, valorFechado: null, criadoEm: "", atualizadoEm: "",
  },
  ultimaReuniao: "2026-08-01",
  mesesDesde: 3,
  retomarEm: "2026-11-01",
};

function fingir(extra: Record<string, unknown> = {}) {
  return fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [] }, "GET /api/reativacao": { corpo: [ITEM] }, ...extra } as never);
}

test("a mensagem de reativação sai com '3 meses'", async () => {
  fingir();
  abrir("/follow-up?aba=reativacao");
  const cartao = await screen.findByRole("article", { name: "Reativar Caldeiraria Sul" });
  expect(within(cartao).getByLabelText("Mensagem de reativação")).toHaveTextContent(
    "Opa, Ana, tudo bem? A gente conversou há mais ou menos 3 meses e lembro que, na época, acabamos não avançando.",
  );
  expect(screen.getByRole("tab", { name: "Reativação" })).toHaveAttribute("aria-selected", "true");
});

test("marcar reunião manda a nova diagnóstica", async () => {
  let enviado: unknown;
  fingir({
    "POST /api/reativacao/1/reuniao": (init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body));
      return { status: 201, corpo: { oportunidade: { ...ITEM.oportunidade, situacao: "diagnostica_marcada" }, reuniao: { id: 9 } } };
    },
  });
  abrir("/follow-up?aba=reativacao");
  const cartao = await screen.findByRole("article", { name: "Reativar Caldeiraria Sul" });
  await userEvent.click(within(cartao).getByRole("button", { name: "Marcar reunião" }));
  const foco = screen.getByRole("dialog", { name: "Marcar reunião · Caldeiraria Sul" });
  await userEvent.type(within(foco).getByLabelText("Data"), "2026-12-03");
  await userEvent.type(within(foco).getByLabelText("Hora"), "10:00");
  await userEvent.click(within(foco).getByRole("button", { name: "Marcar a reunião" }));
  await vi.waitFor(() => expect(enviado).toEqual({ dataHora: "2026-12-03T10:00", formato: "online" }));
});

test("ainda não troca o mês", async () => {
  let enviado: unknown;
  fingir({
    "POST /api/reativacao/1/adiar": (init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ok: true } };
    },
  });
  abrir("/follow-up?aba=reativacao");
  const cartao = await screen.findByRole("article", { name: "Reativar Caldeiraria Sul" });
  await userEvent.click(within(cartao).getByRole("button", { name: "Ainda não" }));
  const foco = screen.getByRole("dialog", { name: "Ainda não · Caldeiraria Sul" });
  const proximoMes = `${diasDepois(`${hojeEmSaoPaulo().slice(0, 7)}-01`, 32).slice(0, 7)}-01`;
  await userEvent.selectOptions(within(foco).getByRole("combobox", { name: "Retomar em" }), proximoMes);
  await userEvent.click(within(foco).getByRole("button", { name: "Guardar o novo mês" }));
  await vi.waitFor(() => expect(enviado).toEqual({ retomarEm: proximoMes }));
});

test("perdida pede o motivo", async () => {
  let enviado: unknown;
  fingir({
    "POST /api/reativacao/1/perdida": (init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ok: true } };
    },
  });
  abrir("/follow-up?aba=reativacao");
  const cartao = await screen.findByRole("article", { name: "Reativar Caldeiraria Sul" });
  await userEvent.click(within(cartao).getByRole("button", { name: "Perdida" }));
  const foco = screen.getByRole("dialog", { name: "Perdida · Caldeiraria Sul" });
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar como perdida" }));
  expect(within(foco).getByRole("alert")).toHaveTextContent("Escolha o motivo.");
  await userEvent.selectOptions(within(foco).getByLabelText("Motivo"), "Sem resposta");
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar como perdida" }));
  await vi.waitFor(() => expect(enviado).toEqual({ motivo: "Sem resposta" }));
});
