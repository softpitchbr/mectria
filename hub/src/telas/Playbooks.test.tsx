import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

test("abas mudam a URL", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/playbooks");
  const abas = await screen.findByRole("navigation", { name: "Playbooks" });
  expect(within(abas).getAllByRole("link").map((l) => l.textContent)).toEqual(["Cold call", "Diagnóstica", "Proposta", "Objeções", "Follow-up"]);
  await userEvent.click(within(abas).getByRole("link", { name: "Objeções" }));
  expect(window.location.pathname).toBe("/playbooks/objecoes");
  expect(screen.getByRole("searchbox", { name: "Buscar objeção" })).toBeInTheDocument();
});

test("busca de objeção sem acento e sem caixa", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/playbooks/objecoes");
  await userEvent.type(await screen.findByRole("searchbox", { name: "Buscar objeção" }), "ESTA CARO");
  const lista = screen.getByRole("list", { name: "Objeções" });
  expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
  expect(lista).toHaveTextContent("Está caro.");
});

test("filtro por etapa", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/playbooks/objecoes");
  await userEvent.click(await screen.findByRole("button", { name: "Cold call" }));
  const itens = within(screen.getByRole("list", { name: "Objeções" })).getAllByRole("listitem");
  expect(itens.length).toBeGreaterThan(0);
  expect(itens.some((i) => i.textContent?.includes("Agora não posso, estou ocupado."))).toBe(true);
  expect(itens.some((i) => i.textContent?.includes("Está caro."))).toBe(false);
});

test("o hunter vê Cold call e Objeções", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.hunter } });
  abrir("/playbooks");
  const abas = await screen.findByRole("navigation", { name: "Playbooks" });
  expect(within(abas).getAllByRole("link").map((l) => l.textContent)).toEqual(["Cold call", "Objeções"]);
  expect(screen.getByRole("heading", { level: 2, name: "Roteiro da ligação" })).toBeInTheDocument();
});

test("a diagnóstica mostra os blocos GPCTBA + C&I", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/playbooks/diagnostica");
  expect(await screen.findByRole("heading", { name: "G · Objetivos" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "C&I · Consequências e implicações" })).toBeInTheDocument();
});
