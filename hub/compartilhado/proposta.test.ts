import { APRESENTACAO_EXEMPLO } from "./dados/apresentacao-exemplo";
import { PLAYBOOK_PROPOSTA } from "./dados/playbooks";
import { servicosDaCarta } from "./dados/servicos-completos";
import {
  apresentacaoDaReuniao,
  dadosDaApresentacao,
  faltandoNaProposta,
  montarSlides,
  partesDoModelo,
  quemDecideNaSala,
  roteiroPadrao,
  slidesDaProposta,
  valoresDaProposta,
  variaveisIniciais,
} from "./proposta";

const oportunidade = { empresa: "Usinagem Alfa", contato: "Ana Souza", servico: "climatizacao" };
const climatizacao = servicosDaCarta().find((s) => s.id === "climatizacao")!;

test("a apresentação de exemplo tem 13 slides, com o céu e inferno em 6º e os 6 pactos", () => {
  const slides = slidesDaProposta();
  expect(slides).toHaveLength(13);
  expect(slides[0]).toMatchObject({ id: "capa", tempoPlanejado: 60, pacto: null, fala: "" });
  expect(slides[5]).toMatchObject({ id: "ceu-inferno", indice: 5, tempoPlanejado: 300, pacto: "dor" });
  expect(slides.map((s) => s.pacto).filter(Boolean).sort()).toEqual(["agenda", "cliente", "dor", "duvida", "fechamento", "valor"]);
});

test("variáveis iniciais trazem o escopo e o que fica com o cliente do serviço", () => {
  const v = variaveisIniciais("climatizacao", climatizacao);
  expect(v.escopo).toContain(climatizacao.entregamos[0]);
  expect(v.ficaComCliente).toContain(climatizacao.ficaComCliente[0]);
  expect(v).toMatchObject({ servico: "climatizacao", valor: null, parcelas: 6, prazo: "", condicoes: "", equipe: "" });
  expect(variaveisIniciais("nao-existe", null)).toMatchObject({ servico: "nao-existe", escopo: "", ficaComCliente: "" });
});

test("o que falta preparar, na ordem", () => {
  expect(faltandoNaProposta(variaveisIniciais("nr-12", servicosDaCarta().find((s) => s.id === "nr-12")!))).toEqual(["Valor", "Prazo", "Time"]);
  expect(faltandoNaProposta({ ...variaveisIniciais("nr-12", servicosDaCarta().find((s) => s.id === "nr-12")!), escopo: " ", valor: 900000, prazo: "45 dias", equipe: "Rui" })).toEqual(["Escopo"]);
});

test("as palavras do cliente vêm da diagnóstica, no meio da frase", () => {
  const { valores, doCliente } = valoresDaProposta({
    oportunidade,
    variaveis: { ...variaveisIniciais("climatizacao", climatizacao), valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" },
    respostas: { "c-dor": "O galpão passa de 38 °C." },
    hoje: "2026-11-13",
    servico: { ...climatizacao, ancoraValor: "um escritório de climatização" },
  });
  expect(valores.dor).toBe("o galpão passa de 38 °C");
  expect(doCliente.has("dor")).toBe(true);
  expect(doCliente.has("valor")).toBe(false);
  expect(valores).toMatchObject({ contato: "Ana", empresa: "Usinagem Alfa", valor: "R$ 12.500,00", parcelas: "6", descontoAVista: "10", prazoProjeto: "45 dias", anos: "13" });
  expect(valores.servico).toBe("Climatização");
  expect(valores.ancora).toBe("um escritório de climatização");
});

test("sem o serviço, o nome e a âncora ficam para completar", () => {
  const { valores } = valoresDaProposta({ oportunidade, variaveis: variaveisIniciais("climatizacao", null), respostas: {}, hoje: "2026-11-13", servico: null });
  expect(valores.servico).toBe("");
  expect(valores.ancora).toBe("");
});

test("roteiroPadrao tem os 13 slides com as falas do playbook", () => {
  const roteiro = roteiroPadrao();
  expect(roteiro.map((s) => s.id)).toEqual(APRESENTACAO_EXEMPLO.map((s) => s.id));
  const passo = PLAYBOOK_PROPOSTA.passos.find((p) => p.id === "ceu-inferno") as { fala: string; tempo: string };
  expect(roteiro[5]).toMatchObject({ id: "ceu-inferno", titulo: "Onde vocês estão e aonde querem chegar", fala: passo.fala, pacto: "dor", tempo: 5 });
  expect(roteiro[0]).toMatchObject({ id: "capa", fala: "", pacto: null, tempo: 1 });
  expect(slidesDaProposta(roteiro).map(({ fala, dica, tempoPlanejado, pacto, id }) => ({ fala, dica, tempoPlanejado, pacto, id }))).toEqual(
    slidesDaProposta().map(({ fala, dica, tempoPlanejado, pacto, id }) => ({ fala, dica, tempoPlanejado, pacto, id })),
  );
});

test("slidesDaProposta com roteiro usa o título e o tempo em segundos", () => {
  const slides = slidesDaProposta([
    { id: "abre", titulo: "Bem-vindos, {empresa}", fala: "Oi!", pacto: "agenda", tempo: 3 },
    { id: "preco", titulo: "Investimento", fala: "", dica: "Respire.", pacto: null, tempo: 2 },
  ]);
  expect(slides).toEqual([
    { id: "abre", indice: 0, rotulo: "", titulo: "Bem-vindos, {empresa}", linhas: [], fala: "Oi!", dica: undefined, tempoPlanejado: 180, pacto: "agenda" },
    { id: "preco", indice: 1, rotulo: "", titulo: "Investimento", linhas: [], fala: "", dica: "Respire.", tempoPlanejado: 120, pacto: null },
  ]);
});

test("apresentacaoDaReuniao sem apresentação usa o exemplo; com apresentação, o roteiro do serviço, ou o padrão quando ele é null", () => {
  expect(apresentacaoDaReuniao(null)).toEqual({ slides: slidesDaProposta(), html: null });
  expect(apresentacaoDaReuniao(climatizacao)).toEqual({ slides: slidesDaProposta(), html: null });
  const comArquivo = { ...climatizacao, apresentacao: { arquivo: "c.html", bytes: 1, versao: 2, enviadaEm: "2026-11-11 10:00:00", enviadaPor: "Diana" } };
  expect(apresentacaoDaReuniao(comArquivo)).toEqual({ slides: slidesDaProposta(roteiroPadrao()), html: "/api/servicos/climatizacao/apresentacao?v=2" });
  const roteiro = [{ id: "um", titulo: "Um", fala: "", pacto: null, tempo: 1 }];
  expect(apresentacaoDaReuniao({ ...comArquivo, roteiro }).slides).toEqual(slidesDaProposta(roteiro));
});

test("dadosDaApresentacao leva os valores, o valor em centavos e as dores do serviço", () => {
  const variaveis = { ...variaveisIniciais("climatizacao", climatizacao), valor: 2400000 };
  expect(dadosDaApresentacao({ empresa: "Alfa", valor: "R$ 24.000,00" }, variaveis, climatizacao)).toEqual({
    empresa: "Alfa",
    valor: "R$ 24.000,00",
    valorCentavos: "2400000",
    doresDoServico: climatizacao.dores.join("\n"),
  });
  expect(dadosDaApresentacao({ empresa: "Alfa" }, { ...variaveis, valor: null }, null)).toEqual({ empresa: "Alfa" });
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
