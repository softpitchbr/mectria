import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChaveTema from "./ChaveTema";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test("escolher Escuro marca o botão, salva e aplica o tema", async () => {
  render(<ChaveTema />);
  await userEvent.click(screen.getByRole("button", { name: "Escuro" }));
  expect(screen.getByRole("button", { name: "Escuro" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Sistema" })).toHaveAttribute("aria-pressed", "false");
  expect(localStorage.getItem("hub-tema")).toBe("escuro");
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});

test("começa marcando a escolha salva", () => {
  localStorage.setItem("hub-tema", "claro");
  render(<ChaveTema />);
  expect(screen.getByRole("button", { name: "Claro" })).toHaveAttribute("aria-pressed", "true");
});
