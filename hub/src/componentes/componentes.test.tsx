import { act, render, screen } from "@testing-library/react";
import Botao from "./Botao";
import Campo from "./Campo";
import Tag from "./Tag";
import Icone from "./Icone";
import Painel from "./Painel";
import { Avisos, avisar } from "./Aviso";

test("botão primário leva a classe da variante", () => {
  render(<Botao variante="primario">Iniciar</Botao>);
  expect(screen.getByRole("button", { name: "Iniciar" })).toHaveClass("primario");
});

test("botão sem variante é secundário e não envia formulário", () => {
  render(<Botao>Cancelar</Botao>);
  const botao = screen.getByRole("button", { name: "Cancelar" });
  expect(botao).toHaveClass("secundario");
  expect(botao).toHaveAttribute("type", "button");
});

test("campo fica acessível pelo rótulo", () => {
  render(<Campo rotulo="E-mail" />);
  expect(screen.getByLabelText("E-mail")).toBeInstanceOf(HTMLInputElement);
});

test("tag de atraso leva a classe de atraso", () => {
  render(<Tag tipo="atrasado">Atrasado</Tag>);
  expect(screen.getByText("Atrasado")).toHaveClass("atrasado");
});

test("ícone é decorativo para leitor de tela", () => {
  const { container } = render(<Icone nome="busca" />);
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});

test("painel em foco leva a classe de foco", () => {
  render(<Painel foco>Conteúdo</Painel>);
  expect(screen.getByText("Conteúdo")).toHaveClass("foco");
});

test("aviso aparece em role=status e some depois de 2,4 s", () => {
  vi.useFakeTimers();
  render(<Avisos />);
  act(() => avisar("Salvo"));
  expect(screen.getByRole("status")).toHaveTextContent("Salvo");
  act(() => vi.advanceTimersByTime(2399));
  expect(screen.getByRole("status")).toHaveTextContent("Salvo");
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole("status")).not.toHaveTextContent("Salvo");
  vi.useRealTimers();
});
