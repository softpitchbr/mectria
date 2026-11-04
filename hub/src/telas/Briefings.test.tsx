import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const BRIEFING = {
  id: 5, oportunidadeId: 1, empresa: "Usinagem Alfa", tipo: "diagnostica", dataHora: "2026-11-03T10:00", formato: "online", situacao: "concluida",
  closerId: 2, closerNome: "Carlos Closer", quemDecide: null, iniciadaEm: null, encerradaEm: null, resultado: "proposta_marcada", motivo: null,
  briefingEnviadoEm: "2026-11-03 15:00:00", oportunidadeSituacao: "proposta_marcada", desfecho: null,
};

const pendencia = (situacao: "aberta" | "respondida", resposta: string | null = null) => ({
  pendencia: { id: 7, anotacaoId: 3, oportunidadeId: 1, texto: "Qual a vazão do sistema?", prazo: "2026-11-04", situacao, resposta, respondidaEm: null, respondidaPor: null },
  empresa: "Usinagem Alfa",
  reuniaoId: 5,
  estado: situacao === "aberta" ? "atrasada" : "respondida",
});

test("Projetos vê os briefings e responde uma pendência em foco", async () => {
  let enviado: unknown;
  let fechou = false;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.projetos },
    "GET /api/briefings": { corpo: [BRIEFING] },
    "GET /api/pendencias": () => ({ corpo: enviado ? [pendencia("respondida", "3 m³/h")] : [pendencia("aberta")] }),
    "POST /api/pendencias/7/responder": (init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: pendencia("respondida", "3 m³/h").pendencia };
    },
    "POST /api/pendencias/7/fechar": () => {
      fechou = true;
      return { corpo: { ...pendencia("respondida", "3 m³/h").pendencia, situacao: "fechada" } };
    },
  } as never);
  abrir("/briefings");
  const briefings = await screen.findByRole("list", { name: "Briefings enviados" });
  expect(within(briefings).getByRole("link", { name: "Abrir o briefing de Usinagem Alfa" })).toHaveAttribute("href", "/reunioes/5/briefing");

  const pendencias = screen.getByRole("list", { name: "Pendências técnicas" });
  expect(pendencias).toHaveTextContent("Atrasada");
  await userEvent.click(within(pendencias).getByRole("button", { name: "Responder: Qual a vazão do sistema?" }));
  const foco = screen.getByRole("dialog", { name: "Pendência · Usinagem Alfa" });
  await userEvent.type(within(foco).getByLabelText("Resposta"), "3 m³/h");
  await userEvent.click(within(foco).getByRole("button", { name: "Enviar resposta" }));
  await vi.waitFor(() => expect(enviado).toEqual({ resposta: "3 m³/h" }));
  expect(await screen.findByRole("button", { name: "Fechar: Qual a vazão do sistema?" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Fechar: Qual a vazão do sistema?" }));
  await vi.waitFor(() => expect(fechou).toBe(true));
});

test("o diretor vê a seção Briefings", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/briefings": { corpo: [] }, "GET /api/pendencias": { corpo: [] } } as never);
  abrir("/briefings");
  expect(await screen.findByRole("heading", { name: "Briefings", level: 1 })).toBeInTheDocument();
  expect(await screen.findByText("Nenhum briefing enviado ainda.")).toBeInTheDocument();
});

test("o closer não vê Briefings", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } } as never);
  abrir("/briefings");
  expect(await screen.findByText(/Seu acesso não inclui Briefings/)).toBeInTheDocument();
});
