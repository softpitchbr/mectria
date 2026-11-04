import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const FICHA = {
  reuniao: {
    id: 5, oportunidadeId: 1, empresa: "Usinagem Alfa", tipo: "diagnostica", dataHora: "2026-11-13T10:00", formato: "online",
    situacao: "concluida", closerId: 2, closerNome: "Vinícius Miguel", quemDecide: null, iniciadaEm: null, encerradaEm: null,
    resultado: "proposta_marcada", motivo: null, briefingEnviadoEm: null,
  },
  oportunidade: { id: 1, empresa: "Usinagem Alfa", contato: "Ana", servico: "climatizacao", closerId: 2, situacao: "proposta_marcada" },
  respostas: { "c-dor": "O galpão passa de 38 °C à tarde", "b-faixa": "Até R$ 30 mil" },
  anotacoes: [{ idCliente: "a", minuto: 12, passo: "x", marcacao: "tecnico", texto: "Pé-direito de 9 m" }],
  pendencias: [],
};

function api(extra: Record<string, unknown> = {}) {
  return fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes/5": { corpo: FICHA }, ...extra } as never);
}

test("mostra as seções com as respostas", async () => {
  api();
  abrir("/reunioes/5/briefing");
  expect(await screen.findByRole("heading", { name: "Briefing para Projetos" })).toBeInTheDocument();
  for (const titulo of ["Contexto", "Comercial", "Anotações técnicas"]) expect(screen.getByRole("heading", { name: titulo })).toBeInTheDocument();
  expect(screen.getByText("O galpão passa de 38 °C à tarde")).toBeInTheDocument();
  expect(screen.getByText("Pé-direito de 9 m")).toBeInTheDocument();
  expect(screen.getByText("Climatização")).toBeInTheDocument();
});

test("Gerar PDF chama a impressão", async () => {
  api();
  const imprimir = vi.fn();
  vi.stubGlobal("print", imprimir);
  abrir("/reunioes/5/briefing");
  await userEvent.click(await screen.findByRole("button", { name: "Gerar PDF" }));
  expect(imprimir).toHaveBeenCalledTimes(1);
});

test("marcar como enviado chama a API e avisa", async () => {
  let chamou = false;
  api({
    "POST /api/reunioes/5/briefing": () => {
      chamou = true;
      return { corpo: { ...FICHA.reuniao, briefingEnviadoEm: "2026-11-13 14:00:00" } };
    },
  });
  abrir("/reunioes/5/briefing");
  await userEvent.click(await screen.findByRole("button", { name: "Marcar como enviado para Projetos" }));
  expect(chamou).toBe(true);
  expect(await screen.findByRole("status")).toHaveTextContent("Briefing marcado como enviado para Projetos.");
});

test("o título da página (nome do PDF) traz o cliente e o dia", async () => {
  api();
  abrir("/reunioes/5/briefing");
  await screen.findByRole("heading", { name: "Briefing para Projetos" });
  expect(document.title).toBe("Briefing · Usinagem Alfa · Sex, 13/11");
});

test("o briefing mostra o próximo passo e o resumo copiado leva a data e o closer", async () => {
  const escrever = vi.fn(async () => {});
  Object.defineProperty(navigator, "clipboard", { value: { writeText: escrever }, configurable: true });
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes/5": {
      corpo: { ...FICHA, proximaReuniao: { ...FICHA.reuniao, id: 6, tipo: "proposta", dataHora: "2026-11-18T14:00", formato: "presencial", situacao: "marcada", quemDecide: "Ana e o sócio", resultado: null } },
    },
  } as never);
  abrir("/reunioes/5/briefing");
  const valorDe = (rotulo: string) => screen.getByText(rotulo, { selector: "dt" }).nextElementSibling;
  await screen.findByText("Apresentação da proposta");
  expect(valorDe("Apresentação da proposta")).toHaveTextContent("Qua, 18/11 às 14:00 · presencial");
  expect(valorDe("Quem decide")).toHaveTextContent("Ana e o sócio");
  await userEvent.click(screen.getByRole("button", { name: "Copiar resumo para o cliente" }));
  const copiado = (escrever.mock.calls[0] as unknown as [string])[0];
  expect(copiado).toContain("apresenta a proposta em Qua, 18/11 às 14:00.");
  expect(copiado).toMatch(/Vinícius Miguel · MecTRIA$/);
});

test("o diretor apaga os dados pessoais com confirmação", async () => {
  let apagou = false;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/reunioes/5": () => ({ corpo: apagou ? { ...FICHA, oportunidade: { ...FICHA.oportunidade, contato: "Dados apagados (LGPD)" } } : FICHA }),
    "POST /api/oportunidades/1/apagar-dados-pessoais": () => {
      apagou = true;
      return { corpo: { ok: true } };
    },
  } as never);
  abrir("/reunioes/5/briefing");
  await userEvent.click(await screen.findByRole("button", { name: "Apagar dados pessoais (LGPD)" }));
  expect(apagou).toBe(false);
  const confirmacao = screen.getByRole("group", { name: "Confirmar exclusão dos dados pessoais" });
  expect(confirmacao).toHaveTextContent("contato, telefone, e-mail e quem decide de Usinagem Alfa");
  await userEvent.click(within(confirmacao).getByRole("button", { name: "Apagar de vez" }));
  await vi.waitFor(() => expect(apagou).toBe(true));
  expect(await screen.findByText("Dados apagados (LGPD)")).toBeInTheDocument();
});

test("o closer não vê o botão de apagar dados pessoais", async () => {
  api();
  abrir("/reunioes/5/briefing");
  await screen.findByRole("button", { name: "Gerar PDF" });
  expect(screen.queryByRole("button", { name: "Apagar dados pessoais (LGPD)" })).toBeNull();
});

test("Projetos lê o briefing sem a ação de enviar e volta para Briefings", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.projetos }, "GET /api/reunioes/5": { corpo: FICHA } } as never);
  abrir("/reunioes/5/briefing");
  await screen.findByRole("button", { name: "Gerar PDF" });
  expect(screen.queryByRole("button", { name: "Marcar como enviado para Projetos" })).toBeNull();
  expect(screen.getByRole("link", { name: "← Briefings" })).toHaveAttribute("href", "/briefings");
  expect(screen.queryByRole("link", { name: "← Reuniões" })).toBeNull();
});

test("o briefing mostra as observações do hunter", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/reunioes/5": { corpo: { ...FICHA, reuniao: { ...FICHA.reuniao, observacoes: "O sócio decide; prefere WhatsApp." } } },
  } as never);
  abrir("/reunioes/5/briefing");
  const linha = (await screen.findByText("Observações do hunter")).closest("div") as HTMLElement;
  expect(linha).toHaveTextContent("O sócio decide; prefere WhatsApp.");
});
