import { APRESENTACAO_EXEMPLO } from "./dados/apresentacao-exemplo";
import { SERVICOS_COMPLETOS } from "./dados/servicos-completos";
import {
  faltandoNaProposta,
  montarSlides,
  partesDoModelo,
  quemDecideNaSala,
  slidesDaProposta,
  valoresDaProposta,
  variaveisIniciais,
} from "./proposta";

const oportunidade = { empresa: "Usinagem Alfa", contato: "Ana Souza", servico: "climatizacao" };

test("a apresentação de exemplo tem 13 slides, com o céu e inferno em 6º e os 6 pactos", () => {
  const slides = slidesDaProposta();
  expect(slides).toHaveLength(13);
  expect(slides[0]).toMatchObject({ id: "capa", tempoPlanejado: 60, pacto: null, fala: "" });
  expect(slides[5]).toMatchObject({ id: "ceu-inferno", indice: 5, tempoPlanejado: 300, pacto: "dor" });
  expect(slides.map((s) => s.pacto).filter(Boolean).sort()).toEqual(["agenda", "cliente", "dor", "duvida", "fechamento", "valor"]);
});

test("variáveis iniciais trazem o escopo e o que fica com o cliente do serviço", () => {
  const v = variaveisIniciais("climatizacao");
  const servico = SERVICOS_COMPLETOS.find((s) => s.id === "climatizacao")!;
  expect(v.escopo).toContain(servico.entregamos[0]);
  expect(v.ficaComCliente).toContain(servico.ficaComCliente[0]);
  expect(v).toMatchObject({ servico: "climatizacao", valor: null, parcelas: 6, prazo: "", condicoes: "", equipe: "" });
});

test("o que falta preparar, na ordem", () => {
  expect(faltandoNaProposta(variaveisIniciais("nr-12"))).toEqual(["Valor", "Prazo", "Time"]);
  expect(faltandoNaProposta({ ...variaveisIniciais("nr-12"), escopo: " ", valor: 900000, prazo: "45 dias", equipe: "Rui" })).toEqual(["Escopo"]);
});

test("as palavras do cliente vêm da diagnóstica, no meio da frase", () => {
  const { valores, doCliente } = valoresDaProposta({
    oportunidade,
    variaveis: { ...variaveisIniciais("climatizacao"), valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" },
    respostas: { "c-dor": "O galpão passa de 38 °C." },
    hoje: "2026-11-13",
  });
  expect(valores.dor).toBe("o galpão passa de 38 °C");
  expect(doCliente.has("dor")).toBe(true);
  expect(doCliente.has("valor")).toBe(false);
  expect(valores).toMatchObject({ contato: "Ana", empresa: "Usinagem Alfa", valor: "R$ 12.500,00", parcelas: "6", descontoAVista: "10", prazoProjeto: "45 dias", anos: "13" });
  expect(valores.servico).toBe("Climatização");
});

test("partes do modelo separam o que é do cliente, variável e pendência", () => {
  const doCliente = new Set(["dor"]);
  expect(partesDoModelo("Hoje: {dor}. [nº]", { dor: "o galpão passa de 38 °C" }, doCliente)).toEqual([
    { texto: "Hoje: ", tipo: "texto" },
    { texto: "o galpão passa de 38 °C", tipo: "cliente" },
    { texto: ". ", tipo: "texto" },
    { texto: "[nº]", tipo: "falta" },
  ]);
  expect(partesDoModelo("De {valor}", {}, doCliente)).toEqual([
    { texto: "De ", tipo: "texto" },
    { texto: "[valor]", tipo: "falta" },
  ]);
  expect(partesDoModelo("{empresa}", { empresa: "Alfa" }, doCliente)).toEqual([{ texto: "Alfa", tipo: "variavel" }]);
});

test("montar os slides preenche título e linhas", () => {
  const slides = montarSlides(slidesDaProposta(), { empresa: "Usinagem Alfa", servico: "Climatização" }, new Set());
  expect(slides).toHaveLength(13);
  expect(slides[0].rotulo.map((p) => p.texto).join("")).toBe("Proposta para Usinagem Alfa");
  expect(slides[0].titulo.map((p) => p.texto).join("")).toBe("Climatização");
});

test("quem decide na sala junta os nomes marcados", () => {
  expect(quemDecideNaSala([{ nome: "Bia", decide: true }, { nome: "Ana", decide: false }, { nome: "Rui", decide: true }])).toBe("Bia e Rui");
  expect(quemDecideNaSala([])).toBe("");
});

test("a apresentação de exemplo não traz os números errados da call", () => {
  const texto = JSON.stringify(APRESENTACAO_EXEMPLO);
  expect(texto).not.toContain("4.950");
  expect(texto).not.toContain("54.900");
  expect(texto).toContain("MecTRIA");
});
