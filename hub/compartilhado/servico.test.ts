import { SERVICOS_COMPLETOS, servicosDaCarta } from "./dados/servicos-completos";
import { idDoServico, urlDaApresentacao, vendavel } from "./servico";

test("idDoServico: 'Adequação à NR-12' dá 'adequacao-a-nr-12'", () => {
  expect(idDoServico("Adequação à NR-12")).toBe("adequacao-a-nr-12");
  expect(idDoServico("  Emissão de Carbono (Emissão Zero) ")).toBe("emissao-de-carbono-emissao-zero");
  expect(idDoServico("x".repeat(80))).toHaveLength(60);
});

test("vendavel: inativo não; ativo e em estruturação sim", () => {
  expect(vendavel({ situacao: "ativo" })).toBe(true);
  expect(vendavel({ situacao: "em_estruturacao" })).toBe(true);
  expect(vendavel({ situacao: "inativo" })).toBe(false);
});

test("urlDaApresentacao traz a versão; sem apresentação, null", () => {
  const apresentacao = { arquivo: "dp.html", bytes: 10, versao: 3, enviadaEm: "2026-11-11 10:00:00", enviadaPor: "Diana" };
  expect(urlDaApresentacao({ id: "desenvolvimento-de-produto", apresentacao })).toBe("/api/servicos/desenvolvimento-de-produto/apresentacao?v=3");
  expect(urlDaApresentacao({ id: "desenho-tecnico", apresentacao: null })).toBeNull();
});

test("servicosDaCarta: os 12 da carta, na ordem, sem mudar um texto", () => {
  const carta = servicosDaCarta();
  expect(carta.map((s) => s.id)).toEqual(SERVICOS_COMPLETOS.map((s) => s.id));
  const dp = carta[0];
  const origem = SERVICOS_COMPLETOS[0];
  expect(dp).toEqual({
    id: origem.id,
    nome: origem.nome,
    sigla: origem.sigla,
    resumo: origem.resumo,
    dores: origem.dores,
    entregamos: origem.entregamos,
    ficaComCliente: origem.ficaComCliente,
    ancoraValor: origem.ancoraValor,
    situacao: "ativo",
    perguntas: origem.perguntas,
    roteiro: null,
    apresentacao: null,
  });
});

test("Emissão de Carbono entra em estruturação e sem perguntas", () => {
  const carbono = servicosDaCarta().find((s) => s.id === "emissao-de-carbono")!;
  expect(carbono.situacao).toBe("em_estruturacao");
  expect(carbono.perguntas).toEqual([]);
  expect(servicosDaCarta().filter((s) => s.situacao === "em_estruturacao").map((s) => s.id)).toEqual(["emissao-de-carbono"]);
});
