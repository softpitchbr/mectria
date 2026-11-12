import { DIAGNOSTICA } from "./dados/diagnostica";
import { servicosDaCarta } from "./dados/servicos-completos";
import { formatarDia } from "./datas";
import { dadosDaDiagnostica, SLIDES_DA_DIAGNOSTICA, slideDoPasso, briefingDaFicha, resumoDoFechamento, resumoParaCliente, roteiroDaDiagnostica, valoresDasRespostas, type Anotacao } from "./diagnostica";

const perguntasDe = (id: string) => servicosDaCarta().find((s) => s.id === id)!.perguntas;
const idDe = (chave: string) => DIAGNOSTICA.blocos.flatMap((b) => b.perguntas).find((p) => p.chave === chave)!.id;

test("roteiro de climatização na ordem certa", () => {
  const grupos = roteiroDaDiagnostica(perguntasDe("climatizacao")).map((p) => p.grupo);
  expect(grupos.filter((g) => g === "abertura")).toHaveLength(2);
  expect(grupos.filter((g) => g === "bloco")).toHaveLength(23);
  expect(grupos.filter((g) => g === "tecnica")).toHaveLength(7);
  expect(grupos.filter((g) => g === "escopo")).toHaveLength(4);
  expect(grupos.at(-1)).toBe("fechamento");
  // a ordem: abertura, blocos, técnica, escopo, fechamento
  const ordem = [...new Set(grupos)];
  expect(ordem).toEqual(["abertura", "bloco", "tecnica", "escopo", "fechamento"]);
  expect(roteiroDaDiagnostica(perguntasDe("climatizacao"))[2]).toMatchObject({ grupo: "bloco", letra: "G" });
});

test("serviço sem perguntas técnicas pula direto ao escopo", () => {
  const grupos = roteiroDaDiagnostica(perguntasDe("emissao-de-carbono")).map((p) => p.grupo);
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
    respostas: { [idDe("orcamento")]: "até R$ 30 mil", [idDe("dor")]: "calor" },
    anotacoes,
    perguntasDoServico: perguntasDe("climatizacao"),
  });
  expect(secoes.map((s) => s.titulo)).toEqual(["Contexto", "Comercial", "Anotações técnicas"]);
  expect(secoes[1].itens[0].resposta).toBe("até R$ 30 mil");
  expect(secoes[2].itens).toEqual([{ pergunta: "Minuto 12", resposta: "Galpão de 800 m², pé-direito de 9 m" }]);
});

test("a pergunta inativa sai do roteiro e continua no briefing", () => {
  const perguntas = [
    { id: "x-area", tipo: "curto" as const, texto: "Qual é a área?", bloco: "parametros" },
    { id: "x-velha", tipo: "curto" as const, texto: "Pergunta antiga?", bloco: "escopo", inativa: true },
  ];
  expect(roteiroDaDiagnostica(perguntas.filter((p) => !p.inativa)).filter((p) => p.grupo === "tecnica").map((p) => p.id)).toEqual(["x-area"]);
  const secoes = briefingDaFicha({ respostas: { "x-velha": "Sim, 300 m²" }, anotacoes: [], perguntasDoServico: perguntas });
  expect(secoes).toEqual([{ titulo: "Técnico do serviço", itens: [{ pergunta: "Pergunta antiga?", resposta: "Sim, 300 m²" }] }]);
});

test("slideDoPasso leva a abertura, os blocos, o escopo e o fechamento aos 5 slides", () => {
  expect(SLIDES_DA_DIAGNOSTICA).toEqual(["agenda", "quem-somos", "escuta", "como-trabalhamos", "proximo-passo"]);
  const roteiro = roteiroDaDiagnostica(perguntasDe("climatizacao"));
  const porGrupo = (grupo: string) => [...new Set(roteiro.filter((p) => p.grupo === grupo).map(slideDoPasso))];
  expect(roteiro.slice(0, 2).map(slideDoPasso)).toEqual([0, 1]);
  expect(porGrupo("bloco")).toEqual([2]);
  expect(porGrupo("tecnica")).toEqual([2]);
  expect(porGrupo("escopo")).toEqual([3]);
  expect(porGrupo("fechamento")).toEqual([4]);
});

test("dadosDaDiagnostica traz a etapa do bloco atual", () => {
  const ficha = {
    reuniao: { dataHora: "2026-11-13T10:00" },
    oportunidade: { empresa: "Solda Hunter", contato: "Ana Souza" },
    servicoNome: "Climatização",
    perguntasDoServico: perguntasDe("climatizacao"),
  };
  const roteiro = roteiroDaDiagnostica(ficha.perguntasDoServico);
  const etapas = [...DIAGNOSTICA.blocos.map((b) => b.titulo), "Técnico"].join("\n");
  expect(dadosDaDiagnostica(ficha, roteiro.find((p) => p.grupo === "bloco")!)).toEqual({
    empresa: "Solda Hunter",
    contato: "Ana",
    data: formatarDia("2026-11-13"),
    servico: "Climatização",
    etapas,
    etapa: DIAGNOSTICA.blocos[0].titulo,
  });
  expect(dadosDaDiagnostica(ficha, roteiro.find((p) => p.grupo === "tecnica")!).etapa).toBe("Técnico");
  expect(dadosDaDiagnostica(ficha, roteiro[0]).etapa).toBe("");
  const semTecnicas = { ...ficha, perguntasDoServico: [] };
  expect(dadosDaDiagnostica(semTecnicas, roteiro[0]).etapas).toBe(DIAGNOSTICA.blocos.map((b) => b.titulo).join("\n"));
});
