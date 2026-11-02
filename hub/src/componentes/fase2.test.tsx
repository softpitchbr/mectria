import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import Foco from "./Foco";
import Medidor from "./Medidor";
import NumeroRolante from "./NumeroRolante";

function ComFoco({ aoSair = () => {} }: { aoSair?: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [origem, setOrigem] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        onClick={(e) => {
          setOrigem(e.currentTarget);
          setAberto(true);
        }}
      >
        Abrir toque
      </button>
      {aberto && (
        <Foco
          titulo="Toque D3"
          origem={origem}
          aoSair={() => {
            aoSair();
            setAberto(false);
          }}
        >
          <button>Copiar mensagem</button>
          <button>Registrar toque</button>
        </Foco>
      )}
    </>
  );
}

test("Foco abre como diálogo e Esc sai devolvendo o foco", async () => {
  const aoSair = vi.fn();
  render(<ComFoco aoSair={aoSair} />);
  await userEvent.click(screen.getByRole("button", { name: "Abrir toque" }));
  const dialogo = screen.getByRole("dialog", { name: "Toque D3" });
  expect(dialogo).toHaveAttribute("aria-modal", "true");
  expect(screen.getByRole("button", { name: "Copiar mensagem" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(aoSair).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Abrir toque" })).toHaveFocus();
});

test("Sair do foco chama aoSair", async () => {
  const aoSair = vi.fn();
  render(<ComFoco aoSair={aoSair} />);
  await userEvent.click(screen.getByRole("button", { name: "Abrir toque" }));
  await userEvent.click(screen.getByRole("button", { name: "Sair do foco" }));
  expect(aoSair).toHaveBeenCalledTimes(1);
});

test("Tab fica preso dentro do foco", async () => {
  render(<ComFoco />);
  await userEvent.click(screen.getByRole("button", { name: "Abrir toque" }));
  await userEvent.tab(); // Copiar → Registrar
  expect(screen.getByRole("button", { name: "Registrar toque" })).toHaveFocus();
  await userEvent.tab(); // último → volta para Sair do foco
  expect(screen.getByRole("button", { name: "Sair do foco" })).toHaveFocus();
  await userEvent.tab({ shift: true }); // primeiro → vai para o último
  expect(screen.getByRole("button", { name: "Registrar toque" })).toHaveFocus();
});

test("Medidor expõe a medida", () => {
  render(<Medidor rotulo="Ligações de hoje" valor={30} total={45} texto="30 de 45" />);
  const medidor = screen.getByRole("meter", { name: "Ligações de hoje" });
  expect(medidor).toHaveAttribute("aria-valuenow", "30");
  expect(medidor).toHaveAttribute("aria-valuemin", "0");
  expect(medidor).toHaveAttribute("aria-valuemax", "45");
  expect(screen.getByText("30 de 45")).toBeInTheDocument();
});

test("Medidor não passa do total nem fica negativo", () => {
  const { container } = render(<Medidor rotulo="Meta" valor={5} total={2} texto="5 de 2" />);
  expect((container.querySelector("[data-preenchido]") as HTMLElement).style.width).toBe("100%");
});

test("NumeroRolante mostra o valor novo", () => {
  const { rerender } = render(<NumeroRolante valor={3} />);
  expect(screen.getByText("3")).toBeInTheDocument();
  rerender(<NumeroRolante valor={4} />);
  expect(screen.getByText("4")).toBeInTheDocument();
  expect(screen.queryByText("3")).not.toBeInTheDocument();
});

test("Esc dentro de um campo só tira o cursor do campo; o segundo Esc sai do foco", async () => {
  const aoSair = vi.fn();
  render(
    <Foco titulo="Nova proposta" aoSair={aoSair}>
      <input aria-label="Empresa" />
    </Foco>,
  );
  const campo = screen.getByRole("textbox", { name: "Empresa" });
  campo.focus();
  await userEvent.keyboard("{Escape}");
  expect(aoSair).not.toHaveBeenCalled();
  expect(campo).not.toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(aoSair).toHaveBeenCalledTimes(1);
});
