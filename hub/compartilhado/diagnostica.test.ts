import { DIAGNOSTICA } from "./dados/diagnostica";
import { briefingDaFicha, resumoDoFechamento, resumoParaCliente, roteiroDaDiagnostica, valoresDasRespostas, type Anotacao } from "./diagnostica";

const idDe = (chave: string) => DIAGNOSTICA.blocos.flatMap((b) => b.perguntas).find((p) => p.chave === chave)!.id;

test("roteiro de climatização na ordem certa", () => {
  const grupos = roteiroDaDiagnostica("climatizacao").map((p) => p.grupo);
  expect(grupos.filter((g) => g === "abertura")).toHaveLength(2);
  expect(grupos.filter((g) => g === "bloco")).toHaveLength(23);
  expect(grupos.filter((g) => g === "tecnica")).toHaveLength(7);
  expect(grupos.filter((g) => g === "escopo")).toHaveLength(4);
  expect(grupos.at(-1)).toBe("fechamento");
  // a ordem: abertura, blocos, técnica, escopo, fechamento
  const ordem = [...new Set(grupos)];
  expect(ordem).toEqual(["abertura", "bloco", "tecnica", "escopo", "fechamento"]);
  expect(roteiroDaDiagnostica("climatizacao")[2]).toMatchObject({ grupo: "bloco", letra: "G" });
});

test("serviço sem perguntas técnicas pula direto ao escopo", () => {
  const grupos = roteiroDaDiagnostica("emissao-de-carbono").map((p) => p.grupo);
  expect(grupos).not.toContain("tecnica");
  expect(grupos.indexOf("escopo")).toBe(25);
});

test("valores usam a chave da pergunta", () => {
  expect(valoresDasRespostas({ [idDe("dor")]: "o galpão passa de 38 °C" })).toMatchObject({ dor: "o galpão passa de 38 °C" });
});

test("resumo do fechamento usa as respostas e mostra o que falta", () => {
  const texto = resumoDoFechamento({ [idDe("dor")]: "o galpão passa de 38 °C", [idDe("objetivo")]: "trabalhar a 26 °C" }, "Ana");
  expect(texto).toContain("o galpão passa de 38 °C");
  expect(texto).toContain("trabalhar a 26 °C");
  expect(texto).toContain("[impacto]");
});

test("resumo para o cliente traz a data da proposta e o nome de quem vende", () => {
  const texto = resumoParaCliente({ [idDe("dor")]: "calor" }, "Ana", { dataProposta: "Qua, 18/11 às 14:00", vendedor: "Carlos Closer" });
  expect(texto).toContain("a gente apresenta a proposta em Qua, 18/11 às 14:00.");
  expect(texto).toMatch(/Carlos Closer · MecTRIA$/);
});

test("resumo para o cliente começa pelo contato", () => {
  expect(resumoParaCliente({ [idDe("dor")]: "calor" }, "Ana")).toMatch(/^Oi, Ana!/);
});

test("briefing separa por seção, omite o vazio e traz as anotações técnicas", () => {
  const anotacoes: Anotacao[] = [
    { idCliente: "a1", minuto: 12, passo: "x", marcacao: "tecnico", texto: "Galpão de 800 m², pé-direito de 9 m" },
    { idCliente: "a2", minuto: 15, passo: "x", marcacao: "objecao", texto: "Achou caro o outro orçamento" },
  ];
  const secoes = briefingDaFicha({
    oportunidade: { servico: "climatizacao" },
    respostas: { [idDe("orcamento")]: "até R$ 30 mil", [idDe("dor")]: "calor" },
    anotacoes,
  });
  expect(secoes.map((s) => s.titulo)).toEqual(["Contexto", "Comercial", "Anotações técnicas"]);
  expect(secoes[1].itens[0].resposta).toBe("até R$ 30 mil");
  expect(secoes[2].itens).toEqual([{ pergunta: "Minuto 12", resposta: "Galpão de 800 m², pé-direito de 9 m" }]);
});
