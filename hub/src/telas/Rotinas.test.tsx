import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const item = (chave: string, titulo: string, feito: boolean, extra: Record<string, unknown> = {}) => ({
  chave,
  titulo,
  origem: chave.includes(":") ? "gerado" : "fixo",
  feito,
  automatico: false,
  ...extra,
});

const DIA = {
  dia: "2026-11-16",
  itens: [
    item("confirmar-reunioes", "Confirmar as reuniões do dia", false),
    item("hipotese-de-dor", "Escrever a hipótese de dor das diagnósticas", true),
    item("briefings", "Mandar os briefings para Projetos no mesmo dia", false),
    item("resultado-reunioes", "Registrar o resultado de cada reunião", false),
    item("toque:7", "D3 · Ligação · Usinagem Alfa", false, { automatico: true, link: "/follow-up?toque=7" }),
  ],
  feitos: 1,
  total: 5,
};

const HISTORICO = [
  { dia: "2026-11-16", feitos: 1, total: 5 },
  { dia: "2026-11-13", feitos: 4, total: 4 },
  { dia: "2026-11-12", feitos: 0, total: 0 },
];

test("marcar item manual chama o PUT e atualiza o medidor", async () => {
  let enviado: unknown;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/rotina": { corpo: DIA },
    "GET /api/rotina/historico": { corpo: HISTORICO },
    "PUT /api/rotina/confirmar-reunioes": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...DIA, itens: DIA.itens.map((i, n) => (n === 0 ? { ...i, feito: true } : i)), feitos: 2 } };
    },
  });
  abrir("/rotinas");
  expect(await screen.findByRole("meter", { name: "Rotina de hoje" })).toHaveAttribute("aria-valuenow", "1");
  await userEvent.click(screen.getByRole("checkbox", { name: "Confirmar as reuniões do dia" }));
  expect(enviado).toEqual({ feito: true });
  expect(await screen.findByText("40% · 2/5")).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "Confirmar as reuniões do dia" })).toBeChecked();
});

test("item automático não tem checkbox e o de toque leva ao follow-up", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/rotina": { corpo: DIA }, "GET /api/rotina/historico": { corpo: HISTORICO } });
  abrir("/rotinas");
  const link = await screen.findByRole("link", { name: "D3 · Ligação · Usinagem Alfa" });
  expect(link).toHaveAttribute("href", "/follow-up?toque=7");
  expect(screen.queryByRole("checkbox", { name: "D3 · Ligação · Usinagem Alfa" })).not.toBeInTheDocument();
});

test("o item de ligações mostra a contagem", async () => {
  const hunter = {
    dia: "2026-11-16",
    itens: [item("ligacoes", "Fazer o bloco de ligações", false, { automatico: true, contagem: { feitas: 1, meta: 2 } })],
    feitos: 0,
    total: 1,
  };
  fingirApi({ "/api/eu": { corpo: PESSOAS.hunter }, "GET /api/rotina": { corpo: hunter }, "GET /api/rotina/historico": { corpo: [] } });
  abrir("/rotinas");
  const linha = (await screen.findByText("Fazer o bloco de ligações")).closest("li") as HTMLElement;
  expect(within(linha).getByText("1/2")).toBeInTheDocument();
});

test("histórico mostra 'Cumprida' só no dia completo", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/rotina": { corpo: DIA }, "GET /api/rotina/historico": { corpo: HISTORICO } });
  abrir("/rotinas");
  const historico = await screen.findByRole("list", { name: "Últimos 14 dias úteis" });
  const dias = within(historico).getAllByRole("listitem");
  expect(dias[1]).toHaveTextContent("Cumprida");
  expect(dias[0]).not.toHaveTextContent("Cumprida");
  expect(dias[2]).toHaveTextContent("Não abriu");
});

test("diretor vê a rotina do time", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/time/resumo": {
      corpo: {
        pessoas: [
          { pessoa: { id: 2, nome: "Carlos Closer", cargo: "closer" }, rotina: { feitos: 3, total: 4 }, atrasados: 1 },
          { pessoa: { id: 1, nome: "Hugo Hunter", cargo: "hunter" }, rotina: { feitos: 0, total: 3 }, atrasados: 0 },
        ],
        reunioesDaSemana: [],
      },
    },
  });
  abrir("/rotinas");
  const time = await screen.findByRole("list", { name: "Rotina do time hoje" });
  const [carlos, hugo] = within(time).getAllByRole("listitem");
  expect(carlos).toHaveTextContent("3/4");
  expect(carlos).toHaveTextContent("75%");
  expect(carlos).toHaveTextContent("1 atrasado");
  expect(hugo).toHaveTextContent("Hunter");
});

const DIA_EM_BLOCOS = {
  dia: "2026-11-16",
  itens: [
    item("fup-negociacao", "Abrir o Follow-up e fazer o FUP de todos os leads em negociação", true, { bloco: "fechamento" }),
    item("toque:7", "D1 · WhatsApp · Usinagem Alfa", false, { automatico: true, link: "/follow-up?proposta=7", bloco: "fechamento" }),
    item("fup-ap-sem-lead", "Fazer o FUP dos leads em Apresentação de Proposta e agendar as APs", true, { automatico: true, bloco: "ap" }),
    item("construir-propostas", "Construir as propostas pendentes", false, { bloco: "construcao" }),
  ],
  feitos: 2,
  total: 4,
  blocos: [
    { id: "fechamento", titulo: "Fechamento e negociação", orientacao: "Prioridade máxima, senso de urgência.", feitos: 1, total: 2 },
    { id: "ap", titulo: "Apresentação de Proposta (AP)", orientacao: "Não deixar lead parado.", feitos: 1, total: 1 },
    { id: "construcao", titulo: "Construção de proposta", orientacao: "Nenhum lead fica mais de 3 dias nesta etapa.", feitos: 0, total: 1 },
    { id: "reativacao", titulo: "Reativação", orientacao: "Simples e constante.", feitos: 0, total: 0 },
  ],
};

test("a rotina aparece em blocos com feitas de total e a orientação; o topo mostra o % do dia", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/rotina": { corpo: DIA_EM_BLOCOS },
    "GET /api/rotina/historico": { corpo: [] },
  });
  abrir("/rotinas");
  const fechamento = await screen.findByRole("region", { name: "Fechamento e negociação" });
  expect(fechamento).toHaveTextContent("1 de 2");
  expect(fechamento).toHaveTextContent("Prioridade máxima, senso de urgência.");
  expect(within(fechamento).getByRole("list", { name: "Itens de Fechamento e negociação" })).toHaveTextContent("D1 · WhatsApp · Usinagem Alfa");
  expect(screen.getByRole("region", { name: "Reativação" })).toHaveTextContent("Nada neste bloco hoje.");
  expect(screen.getByRole("meter", { name: "Rotina de hoje" })).toHaveTextContent("50%");
});

test("o item de cold call diz que a contagem é de conexões na semana", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "GET /api/rotina": {
      corpo: {
        dia: "2026-11-16",
        itens: [item("cold-call", "Fazer o bloco de cold call", true, { automatico: true, contagem: { feitas: 1, meta: 8, rotulo: "conexões na semana" } })],
        feitos: 1,
        total: 1,
      },
    },
    "GET /api/rotina/historico": { corpo: [] },
  });
  abrir("/rotinas");
  expect(await screen.findByText("1/8 conexões na semana")).toBeInTheDocument();
});
