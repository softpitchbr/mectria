import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import QuadroDoHtml, { type ControleDoQuadro } from "./QuadroDoHtml";

const props = { titulo: "Apresentação · Alfa", slide: 0, dados: { empresa: "Alfa" }, interacoes: { dores: [], precoEtapa: 0, calculadora: {} }, aoReceber: () => {} };

test("trocar a url recria o iframe", () => {
  const { rerender } = render(<QuadroDoHtml {...props} url="/api/servicos/a/apresentacao?v=1" />);
  const primeiro = screen.getByTitle("Apresentação · Alfa");
  rerender(<QuadroDoHtml {...props} url="/api/servicos/a/apresentacao?v=2" />);
  const segundo = screen.getByTitle("Apresentação · Alfa");
  expect(segundo).not.toBe(primeiro);
  expect(segundo.getAttribute("src")).toBe("/api/servicos/a/apresentacao?v=2");
});

test("o controle aciona e calcula no iframe; a troca de slide manda o slide", () => {
  const controle = createRef<ControleDoQuadro>();
  const { rerender } = render(<QuadroDoHtml {...props} url="/x" ref={controle} />);
  const janela = (screen.getByTitle("Apresentação · Alfa") as HTMLIFrameElement).contentWindow!;
  const enviar = vi.spyOn(janela, "postMessage");
  controle.current!.acionar("revelar-preco");
  controle.current!.calcular({ "custo-hora": 300 });
  rerender(<QuadroDoHtml {...props} url="/x" ref={controle} slide={4} />);
  expect(enviar.mock.calls.map((c) => c[0])).toEqual([
    { mectria: 1, tipo: "acionar", acao: "revelar-preco" },
    { mectria: 1, tipo: "calcular", valores: { "custo-hora": 300 } },
    { mectria: 1, tipo: "slide", slide: 4 },
  ]);
});
