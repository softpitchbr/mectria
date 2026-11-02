import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const R = (id: number, empresa: string, dataHora: string, situacao = "marcada", tipo = "diagnostica") => ({
  id, oportunidadeId: id, empresa, tipo, dataHora, formato: "online", situacao, closerId: 2, closerNome: "Vinícius Miguel",
  quemDecide: null, iniciadaEm: null, encerradaEm: null, resultado: situacao === "concluida" ? "proposta_marcada" : null, motivo: null, briefingEnviadoEm: null,
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
  const delta = screen.getByText("Plásticos Delta").closest("li") as HTMLElement;
  expect(within(beta).getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  expect(within(gama).getByRole("link", { name: "Briefing" })).toHaveAttribute("href", "/reunioes/3/briefing");
  expect(within(delta).getByRole("button", { name: "Iniciar" })).toBeDisabled();
  await userEvent.click(within(alfa).getByRole("button", { name: "Iniciar" }));
  expect(window.location.pathname).toBe("/reunioes/1/diagnostica");
});
