import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "../api/cliente";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const SEM_ACESSO = "Seu e-mail não tem acesso ao hub. Fale com o diretor comercial da MecTRIA.";

async function rotulosDaNavegacao(nome = "Seções") {
  const nav = await screen.findByRole("navigation", { name: nome });
  return within(nav)
    .getAllByRole("link")
    .map((l) => l.getAttribute("aria-label"));
}

test("hunter vê Hoje, Reuniões, Playbooks e Rotinas e não vê Time", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.hunter } });
  abrir("/");
  expect(await rotulosDaNavegacao()).toEqual(["Hoje", "Reuniões", "Playbooks", "Rotinas"]);
});

test("diretor vê as 8 seções", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor } });
  abrir("/");
  expect(await rotulosDaNavegacao()).toEqual([
    "Hoje",
    "Reuniões",
    "Follow-up",
    "Playbooks",
    "Apresentações",
    "Rotinas",
    "Time",
    "Briefings",
  ]);
});

test("hunter abrindo /time direto vê que a seção não é do cargo dele", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.hunter } });
  abrir("/time");
  expect(await screen.findByText("Seu acesso não inclui Time. Fale com o diretor comercial da MecTRIA.")).toBeInTheDocument();
});

test("diretor abre a seção Briefings, que chegou na fase 6", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/briefings": { corpo: [] }, "GET /api/pendencias": { corpo: [] } } as never);
  abrir("/briefings");
  expect(await screen.findByRole("heading", { name: "Briefings", level: 1 })).toBeInTheDocument();
});

test("/api/eu respondendo 403 mostra a tela de sem acesso", async () => {
  fingirApi({ "/api/eu": { status: 403, corpo: { erro: "sem_acesso", mensagem: SEM_ACESSO } } });
  abrir("/");
  expect(await screen.findByText(SEM_ACESSO)).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Seções" })).not.toBeInTheDocument();
});

test("um 403 sem_acesso em outra chamada, depois de logado, troca a tela", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "/api/outra": { status: 403, corpo: { erro: "sem_acesso", mensagem: SEM_ACESSO } },
  });
  abrir("/");
  await screen.findByRole("navigation", { name: "Seções" });
  await act(async () => {
    await api("/api/outra").catch(() => {});
  });
  expect(await screen.findByText(SEM_ACESSO)).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Seções" })).not.toBeInTheDocument();
});

test("às 14h, Boa tarde com o primeiro nome e a data por extenso", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 2, 14, 0));
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/");
  expect(await screen.findByRole("heading", { name: "Boa tarde, Vinícius" })).toBeInTheDocument();
  expect(screen.getByText("Segunda, 2 de novembro")).toBeInTheDocument();
});

test("no celular, a barra de baixo mostra 4 seções e Mais abre as outras", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor } });
  abrir("/");
  expect(await rotulosDaNavegacao("Seções no celular")).toEqual(["Hoje", "Reuniões", "Follow-up", "Playbooks"]);
  await userEvent.click(screen.getByRole("button", { name: "Mais" }));
  const mais = within(screen.getByRole("navigation", { name: "Mais seções" }));
  expect(mais.getAllByRole("link").map((l) => l.textContent)).toEqual(["Apresentações", "Rotinas", "Time", "Briefings"]);
});

test("perfil mostra nome, cargo, tema e o link de sair do Access", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: /Perfil/ }));
  expect(screen.getByText("Vinícius Miguel")).toBeInTheDocument();
  expect(screen.getByText("Closer")).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sair" })).toHaveAttribute("href", "/cdn-cgi/access/logout");
});
