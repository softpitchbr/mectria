import { screen } from "@testing-library/react";
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
