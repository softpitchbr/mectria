import { formatarDia, formatarReais } from "./datas";
import { APRESENTACAO_EXEMPLO } from "./dados/apresentacao-exemplo";
import { VARIAVEIS } from "./dados/cadencia";
import { DIAGNOSTICA } from "./dados/diagnostica";
import { EMPRESA } from "./dados/empresa";
import { PLAYBOOK_PROPOSTA } from "./dados/playbooks";
import type { Interacoes } from "./contrato-apresentacao";
import type { Anotacao, Respostas } from "./diagnostica";
import type { Oportunidade, Reuniao } from "./oportunidade";
import { urlDaApresentacao, type Servico, type SlideDoRoteiro } from "./servico";

export type IdPacto = "agenda" | "dor" | "duvida" | "cliente" | "valor" | "fechamento";
export const IDS_PACTO: readonly IdPacto[] = PLAYBOOK_PROPOSTA.pactos.map((p) => p.id as IdPacto);

/** As variáveis da apresentação de cada cliente (spec, seção 8, "propostas"). */
export interface VariaveisProposta {
  servico: string;
  escopo: string;
  ficaComCliente: string;
  /** Centavos; null enquanto não foi preparado. */
  valor: number | null;
  parcelas: number;
  prazo: string;
  condicoes: string;
  equipe: string;
}

export interface PessoaNaSala {
  nome: string;
  decide: boolean;
}

export interface PactoFeito {
  id: IdPacto;
  minuto: number;
}

/** O que muda durante a reunião: quem está na sala, os pactos, o tempo de cada slide (s) e o slide atual. */
export interface Andamento {
  sala: PessoaNaSala[];
  pactos: PactoFeito[];
  tempos: Record<string, number>;
  slide: number;
  /** O que a apresentação em HTML contou (dores, preço, calculadora). Só existe com apresentação própria. */
  interacoes?: Interacoes;
}

export type DesfechoProposta = "ganho" | "decidir" | "ajuste" | "perdido";

export type FechamentoProposta =
  | { desfecho: "decidir" | "ajuste"; valor: number; dataDecisao: string; quemDecide: string; observacao?: string }
  /** Fechou: valor é o apresentado; valorFechado é o que o cliente vai pagar (o desconto à vista muda). */
  | { desfecho: "ganho"; valor: number; valorFechado: number }
  | { desfecho: "perdido"; valor: number; motivo: string };

export interface SessaoProposta {
  reuniao: Reuniao;
  oportunidade: Oportunidade;
  variaveis: VariaveisProposta;
  andamento: Andamento;
  anotacoes: Anotacao[];
  respostasDaDiagnostica: Respostas;
  /** O serviço da proposta (o de variaveis.servico), com o roteiro e a apresentação; null se não existe mais. */
  servico: Servico | null;
}

export type Parte = { texto: string; tipo: "texto" | "cliente" | "variavel" | "falta" };

export interface SlideDaProposta {
  id: string;
  indice: number;
  rotulo: string;
  titulo: string;
  linhas: string[];
  fala: string;
  dica?: string;
  /** Segundos. */
  tempoPlanejado: number;
  pacto: IdPacto | null;
}

export interface SlideMontado {
  id: string;
  rotulo: Parte[];
  titulo: Parte[];
  linhas: Parte[][];
}

const linhasDe = (itens: readonly string[]) => itens.join("\n");

/** Começo da preparação: escopo e o que fica com o cliente vêm do serviço cadastrado. */
export function variaveisIniciais(servicoId: string, s: Pick<Servico, "entregamos" | "ficaComCliente"> | null): VariaveisProposta {
  return {
    servico: servicoId,
    escopo: s ? linhasDe(s.entregamos) : "",
    ficaComCliente: s ? linhasDe(s.ficaComCliente) : "",
    valor: null,
    parcelas: EMPRESA.regras.parcelasSemJuros,
    prazo: "",
    condicoes: "",
    equipe: "",
  };
}

/** O que ainda falta para a reunião, na ordem em que aparece na preparação. */
export function faltandoNaProposta(v: VariaveisProposta): string[] {
  const falta: string[] = [];
  if (v.valor === null || v.valor <= 0) falta.push("Valor");
  if (!v.escopo.trim()) falta.push("Escopo");
  if (!v.prazo.trim()) falta.push("Prazo");
  if (!v.equipe.trim()) falta.push("Time");
  return falta;
}

/** "2 min" → 2. */
const minutosDe = (tempo: string) => Number.parseInt(tempo, 10) || 1;

type PassoDoPlaybook = { fala: string; dica?: string; tempo: string; pacto?: string };
const passoDe = (id: string | null) => PLAYBOOK_PROPOSTA.passos.find((p) => p.id === id) as PassoDoPlaybook | undefined;

/** O roteiro padrão: os 13 slides da apresentação de exemplo, com a fala, a dica, o pacto e o tempo do playbook. */
export function roteiroPadrao(): SlideDoRoteiro[] {
  return APRESENTACAO_EXEMPLO.map((s) => {
    const passo = passoDe(s.passo);
    return {
      id: s.id,
      titulo: s.titulo,
      fala: passo?.fala ?? "",
      ...(passo?.dica ? { dica: passo.dica } : {}),
      pacto: (passo?.pacto as IdPacto | undefined) ?? null,
      tempo: passo ? minutosDe(passo.tempo) : 1,
    };
  });
}

/**
 * Os slides do painel. Sem roteiro, os 13 da apresentação de exemplo (que o hub desenha);
 * com o roteiro de um serviço, só o título (a apresentação em HTML desenha o resto).
 */
export function slidesDaProposta(roteiro?: SlideDoRoteiro[] | null): SlideDaProposta[] {
  if (roteiro) {
    return roteiro.map((s, indice) => ({
      id: s.id,
      indice,
      rotulo: "",
      titulo: s.titulo,
      linhas: [],
      fala: s.fala,
      dica: s.dica,
      tempoPlanejado: s.tempo * 60,
      pacto: s.pacto,
    }));
  }
  return APRESENTACAO_EXEMPLO.map((s, indice) => {
    const passo = passoDe(s.passo);
    return {
      id: s.id,
      indice,
      rotulo: s.rotulo,
      titulo: s.titulo,
      linhas: s.linhas,
      fala: passo?.fala ?? "",
      dica: passo?.dica,
      tempoPlanejado: passo ? minutosDe(passo.tempo) * 60 : 60,
      pacto: (passo?.pacto as IdPacto | undefined) ?? null,
    };
  });
}

/** Com apresentação própria, o HTML e o roteiro do serviço (ou o padrão); sem ela, a de exemplo. */
export function apresentacaoDaReuniao(servico: Servico | null): { slides: SlideDaProposta[]; html: string | null } {
  const html = servico ? urlDaApresentacao(servico) : null;
  return { slides: html ? slidesDaProposta(servico!.roteiro ?? roteiroPadrao()) : slidesDaProposta(), html };
}

/** O que vai para a apresentação em HTML: os valores, o valor em centavos e as dores do serviço (CONTRATO.md). */
export function dadosDaApresentacao(
  valores: Record<string, string>,
  variaveis: Pick<VariaveisProposta, "valor">,
  servico: Pick<Servico, "dores"> | null,
): Record<string, string> {
  return {
    ...valores,
    ...(variaveis.valor ? { valorCentavos: String(variaveis.valor) } : {}),
    ...(servico?.dores.length ? { doresDoServico: servico.dores.join("\n") } : {}),
  };
}

// Como na 0.2 (hub-comercial/js/base.js): essas respostas entram no meio da frase, com a inicial minúscula.
const MEIO_DE_FRASE = ["dor", "objetivo", "impacto", "prazo", "ganho", "tentativas", "porqueAgora", "criterio", "numeros", "prazoDecisao"];

function minusculaInicial(texto: string): string {
  const segunda = texto.charAt(1);
  if (segunda && segunda !== segunda.toLowerCase()) return texto; // NR-12, CNC...
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

const TODAS_AS_PERGUNTAS = DIAGNOSTICA.blocos.flatMap((b) => b.perguntas);
const emFrase = (texto: string) =>
  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("; ")
    .toLowerCase();

/** Os valores das falas e dos slides: o que veio da diagnóstica (doCliente), as variáveis e os dados da MecTRIA. */
export function valoresDaProposta(ctx: {
  oportunidade: Pick<Oportunidade, "empresa" | "contato" | "servico">;
  variaveis: VariaveisProposta;
  respostas: Respostas;
  hoje: string;
  servico: Pick<Servico, "nome" | "ancoraValor"> | null;
}): { valores: Record<string, string>; doCliente: Set<string> } {
  const { oportunidade, variaveis: v, respostas, hoje, servico } = ctx;
  const valores: Record<string, string> = {
    contato: oportunidade.contato.trim().split(/\s+/)[0] ?? "",
    empresa: oportunidade.empresa,
    servico: servico?.nome ?? "",
    data: formatarDia(hoje),
    anos: String(Number(hoje.slice(0, 4)) - EMPRESA.fundacao),
    parcelas: String(v.parcelas),
    descontoAVista: String(EMPRESA.regras.descontoAVista),
    fraseValor: EMPRESA.fraseValor,
    ancora: servico?.ancoraValor ?? "",
    entregamos: emFrase(v.escopo),
    fica: emFrase(v.ficaComCliente),
    prazoProjeto: v.prazo.trim(),
    equipe: v.equipe.trim(),
  };
  if (v.valor) valores.valor = formatarReais(v.valor);

  const doCliente = new Set<string>();
  for (const p of TODAS_AS_PERGUNTAS) {
    const texto = respostas[p.id]?.trim().replace(/[.;]+$/, "");
    if (!p.chave || !texto) continue;
    valores[p.chave] = MEIO_DE_FRASE.includes(p.chave) ? minusculaInicial(texto) : texto;
    doCliente.add(p.chave);
  }
  return { valores, doCliente };
}

/** Separa o modelo em partes: palavras do cliente, variáveis preenchidas e pendências ([rótulo]). */
export function partesDoModelo(modelo: string, valores: Record<string, string>, doCliente: Set<string>): Parte[] {
  const partes: Parte[] = [];
  for (const pedaco of modelo.split(/(\{\w+\}|\[[^\]]+\])/)) {
    if (!pedaco) continue;
    const chave = /^\{(\w+)\}$/.exec(pedaco)?.[1];
    if (chave) {
      const valor = valores[chave]?.trim();
      if (valor) partes.push({ texto: valor, tipo: doCliente.has(chave) ? "cliente" : "variavel" });
      else partes.push({ texto: `[${VARIAVEIS[chave] ?? chave}]`, tipo: "falta" });
    } else if (/^\[[^\]]+\]$/.test(pedaco)) {
      partes.push({ texto: pedaco, tipo: "falta" });
    } else {
      partes.push({ texto: pedaco, tipo: "texto" });
    }
  }
  return partes;
}

export function montarSlides(slides: SlideDaProposta[], valores: Record<string, string>, doCliente: Set<string>): SlideMontado[] {
  return slides.map((s) => ({
    id: s.id,
    rotulo: partesDoModelo(s.rotulo, valores, doCliente),
    titulo: partesDoModelo(s.titulo, valores, doCliente),
    linhas: s.linhas.map((l) => partesDoModelo(l, valores, doCliente)),
  }));
}

/** "Bia e Rui": quem está marcado como quem decide. */
export function quemDecideNaSala(sala: PessoaNaSala[]): string {
  const nomes = sala.filter((p) => p.decide).map((p) => p.nome);
  if (nomes.length <= 1) return nomes[0] ?? "";
  return `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}
