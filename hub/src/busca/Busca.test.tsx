import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

async function abrirBusca(cargo: keyof typeof PESSOAS = "diretor") {
  fingirApi({ "/api/eu": { corpo: PESSOAS[cargo] } });
  abrir("/");
  await screen.findByRole("navigation", { name: "Seções" });
  await userEvent.keyboard("{Control>}k{/Control}");
  return screen.getByRole("dialog", { name: "Buscar no hub" });
}

function titulos(dialogo: HTMLElement) {
  return within(dialogo)
    .getAllByRole("option")
    .map((o) => o.querySelector("[data-titulo]")?.textContent);
}

test("Ctrl+K abre a busca com o foco no campo", async () => {
  const dialogo = await abrirBusca();
  expect(dialogo).toHaveAttribute("aria-modal", "true");
  expect(within(dialogo).getByRole("combobox")).toHaveFocus();
});

test("o botão Buscar do topo abre a busca", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Buscar · Ctrl K" }));
  expect(screen.getByRole("dialog", { name: "Buscar no hub" })).toBeInTheDocument();
});

test("digitar follow e Enter navega para /follow-up e fecha", async () => {
  await abrirBusca();
  await userEvent.keyboard("follow{Enter}");
  expect(window.location.pathname).toBe("/follow-up");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(await screen.findByText("Follow-up chega na fase 2.")).toBeInTheDocument();
});

test("as setas mudam o item selecionado", async () => {
  const dialogo = await abrirBusca();
  const opcoes = () => within(dialogo).getAllByRole("option");
  expect(opcoes()[0]).toHaveAttribute("aria-selected", "true");
  await userEvent.keyboard("{ArrowDown}");
  expect(opcoes()[0]).toHaveAttribute("aria-selected", "false");
  expect(opcoes()[1]).toHaveAttribute("aria-selected", "true");
  await userEvent.keyboard("{ArrowUp}{ArrowUp}");
  expect(opcoes()[opcoes().length - 1]).toHaveAttribute("aria-selected", "true");
});

test("Esc fecha", async () => {
  await abrirBusca();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("um hunter não vê Ir para Time", async () => {
  const dialogo = await abrirBusca("hunter");
  await userEvent.keyboard("ir para");
  expect(titulos(dialogo)).toEqual(["Ir para Hoje", "Ir para Playbooks", "Ir para Rotinas"]);
});

test("busca sem resultado diz que não achou", async () => {
  const dialogo = await abrirBusca();
  await userEvent.keyboard("xyzw");
  expect(within(dialogo).getByText("Nada encontrado para “xyzw”.")).toBeInTheDocument();
});

test("escolher tema escuro pela busca aplica o tema", async () => {
  await abrirBusca();
  await userEvent.keyboard("tema escuro{Enter}");
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

test("clicar numa área vazia da caixa mantém o foco no campo", async () => {
  const dialogo = await abrirBusca();
  await userEvent.keyboard("xyzw");
  await userEvent.click(within(dialogo).getByText("Nada encontrado para “xyzw”."));
  expect(within(dialogo).getByRole("combobox")).toHaveFocus();
});
