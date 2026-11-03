import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const R = (id: number, empresa: string, dataHora: string, situacao = "marcada", tipo = "diagnostica") => ({
  id, oportunidadeId: id, empresa, tipo, dataHora, formato: "online", situacao, closerId: 2, closerNome: "Vinícius Miguel",
  quemDecide: null, iniciadaEm: null, encerradaEm: null, resultado: situacao === "concluida" ? "proposta_marcada" : null, motivo: null, briefingEnviadoEm: null,
  oportunidadeSituacao: situacao === "concluida" || tipo === "proposta" ? "proposta_marcada" : "diagnostica_marcada",
  desfecho: null,
});

const AGENDA = [
  R(1, "Usinagem Alfa", "2099-11-10T09:00"),
  R(2, "Metalúrgica Beta", "2099-11-10T14:00", "em_andamento"),
  R(3, "Agro Gama", "2099-11-11T10:00", "concluida"),
  R(4, "Plásticos Delta", "2099-11-11T16:00", "marcada", "proposta"),
];

test("agenda agrupada por dia", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes": { corpo: AGENDA } });
  abrir("/reunioes");
  const dias = await screen.findAllByRole("region");
  expect(dias.map((d) => d.getAttribute("aria-label"))).toEqual(["Ter, 10/11", "Qua, 11/11"]);
  expect(within(dias[0]).getAllByRole("listitem")).toHaveLength(2);
});

test("Iniciar leva ao painel; em andamento mostra Continuar; concluída mostra o briefing", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes": { corpo: AGENDA }, "GET /api/reunioes/1": { status: 404, corpo: { erro: "nao_encontrado", mensagem: "x" } } });
  abrir("/reunioes");
  const alfa = (await screen.findByText("Usinagem Alfa")).closest("li") as HTMLElement;
  const beta = screen.getByText("Metalúrgica Beta").closest("li") as HTMLElement;
  const gama = screen.getByText("Agro Gama").closest("li") as HTMLElement;
  expect(within(beta).getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  expect(within(gama).getByRole("link", { name: "Briefing" })).toHaveAttribute("href", "/reunioes/3/briefing");
  await userEvent.click(within(alfa).getByRole("button", { name: "Iniciar" }));
  expect(window.location.pathname).toBe("/reunioes/1/diagnostica");
});

test("diagnóstica cuja oportunidade já passou dela não oferece Iniciar, e a passada sai da lista de sem resultado", async () => {
  const andou = { ...R(5, "Fundição Épsilon", "2099-11-10T11:00"), oportunidadeSituacao: "em_followup" };
  const passada = { ...R(6, "Caldeiraria Zeta", "2020-01-10T11:00"), oportunidadeSituacao: "ganha" };
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes": { corpo: [...AGENDA, andou, passada] } });
  abrir("/reunioes");
  const epsilon = (await screen.findByText("Fundição Épsilon")).closest("li") as HTMLElement;
  expect(within(epsilon).queryByRole("button", { name: /Iniciar|Continuar/ })).not.toBeInTheDocument();
  expect(within(epsilon).getByText("A oportunidade já passou da diagnóstica")).toBeInTheDocument();
  expect(screen.queryByText("Caldeiraria Zeta")).not.toBeInTheDocument();
});

test("Iniciar da proposta leva ao painel da proposta", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes": { corpo: AGENDA }, "GET /api/reunioes/4/proposta": { status: 404, corpo: { erro: "nao_encontrado", mensagem: "x" } } });
  abrir("/reunioes");
  const delta = (await screen.findByText("Plásticos Delta")).closest("li") as HTMLElement;
  await userEvent.click(within(delta).getByRole("button", { name: "Iniciar" }));
  expect(window.location.pathname).toBe("/reunioes/4/proposta");
});

test("proposta cuja oportunidade já andou não oferece Iniciar; a concluída mostra o desfecho", async () => {
  const andou = { ...R(5, "Fundição Épsilon", "2099-11-10T11:00", "marcada", "proposta"), oportunidadeSituacao: "em_followup" };
  const concluida = { ...R(6, "Caldeiraria Zeta", "2099-11-10T15:00", "concluida", "proposta"), desfecho: "decidir" };
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes": { corpo: [andou, concluida] } });
  abrir("/reunioes");
  const epsilon = (await screen.findByText("Fundição Épsilon")).closest("li") as HTMLElement;
  expect(within(epsilon).queryByRole("button")).not.toBeInTheDocument();
  expect(within(epsilon).getByText("A oportunidade já passou da proposta")).toBeInTheDocument();
  const zeta = screen.getByText("Caldeiraria Zeta").closest("li") as HTMLElement;
  expect(within(zeta).getByText("Concluída · Vai decidir (data combinada)")).toBeInTheDocument();
});

test("proposta passada sem fechamento continua na agenda, com Continuar ou Iniciar", async () => {
  const ontemEmAndamento = R(11, "Forja Ontem", "2020-01-10T14:00", "em_andamento", "proposta");
  const passadaMarcada = R(12, "Usina Antiga", "2020-01-09T09:00", "marcada", "proposta");
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/reunioes": { corpo: [ontemEmAndamento, passadaMarcada] } });
  abrir("/reunioes");
  const forja = (await screen.findByText("Forja Ontem")).closest("li") as HTMLElement;
  expect(within(forja).getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  const usina = screen.getByText("Usina Antiga").closest("li") as HTMLElement;
  expect(within(usina).getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
});
