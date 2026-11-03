import { hojeEmSaoPaulo, lerReais } from "../compartilhado/datas";
import { MOTIVOS_PERDA } from "../compartilhado/dados/cadencia";
import { MOTIVOS_NAO_QUALIFICOU } from "../compartilhado/dados/diagnostica";
import type { Anotacao, Marcacao } from "../compartilhado/diagnostica";
import { SERVICOS } from "../compartilhado/dados/servicos";
import { CANAIS_DE_TOQUE, type FechamentoDiagnostica, type NovaDiagnostica, type NovaProposta, type ResultadoLigacao, type ResultadoProposta } from "../compartilhado/oportunidade";
import { CARGOS, type Cargo } from "../compartilhado/cargos";
import { normalizarEmail } from "../compartilhado/texto";
import { IDS_PACTO, slidesDaProposta, type Andamento, type FechamentoProposta, type IdPacto, type PessoaNaSala, type VariaveisProposta } from "../compartilhado/proposta";

export type Validado<T> = { ok: true; dados: T } | { ok: false; mensagem: string };

const FORMATO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MENSAGEM = {
  corpo: "Não foi possível ler os dados enviados.",
  nome: "O nome precisa ter de 2 a 80 caracteres.",
  email: "Confira o e-mail: ele precisa ter o formato nome@dominio.com.",
  cargo: "Escolha um cargo: Hunter, Closer, Diretor comercial ou Projetos.",
  ativo: "Não foi possível entender se a pessoa fica ativa ou não.",
  vazio: "Nada para mudar.",
};

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function nomeValido(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const nome = valor.trim().replace(/\s+/g, " ");
  return nome.length >= 2 && nome.length <= 80 ? nome : null;
}

function cargoValido(valor: unknown): Cargo | null {
  return CARGOS.includes(valor as Cargo) ? (valor as Cargo) : null;
}

export function validarNovaPessoa(corpo: unknown): Validado<{ nome: string; email: string; cargo: Cargo }> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const nome = nomeValido(corpo.nome);
  if (!nome) return { ok: false, mensagem: MENSAGEM.nome };
  const email = typeof corpo.email === "string" ? normalizarEmail(corpo.email) : "";
  if (!FORMATO_EMAIL.test(email) || email.includes("..")) return { ok: false, mensagem: MENSAGEM.email };
  const cargo = cargoValido(corpo.cargo);
  if (!cargo) return { ok: false, mensagem: MENSAGEM.cargo };
  return { ok: true, dados: { nome, email, cargo } };
}

export function validarMudancas(corpo: unknown): Validado<{ nome?: string; cargo?: Cargo; ativo?: boolean }> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const dados: { nome?: string; cargo?: Cargo; ativo?: boolean } = {};
  if (corpo.nome !== undefined) {
    const nome = nomeValido(corpo.nome);
    if (!nome) return { ok: false, mensagem: MENSAGEM.nome };
    dados.nome = nome;
  }
  if (corpo.cargo !== undefined) {
    const cargo = cargoValido(corpo.cargo);
    if (!cargo) return { ok: false, mensagem: MENSAGEM.cargo };
    dados.cargo = cargo;
  }
  if (corpo.ativo !== undefined) {
    if (typeof corpo.ativo !== "boolean") return { ok: false, mensagem: MENSAGEM.ativo };
    dados.ativo = corpo.ativo;
  }
  if (Object.keys(dados).length === 0) return { ok: false, mensagem: MENSAGEM.vazio };
  return { ok: true, dados };
}

/** Lê o corpo JSON sem quebrar quando ele não é JSON. */
export async function lerCorpo(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

// Fase 2 ------------------------------------------------------------------------


const DIA = /^\d{4}-\d{2}-\d{2}$/;
const DIA_E_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function diaValido(valor: unknown): valor is string {
  return typeof valor === "string" && DIA.test(valor) && !Number.isNaN(Date.parse(`${valor}T12:00:00Z`));
}

function textoEntre(valor: unknown, min: number, max: number): string | null {
  if (typeof valor !== "string") return min === 0 ? "" : null;
  const t = valor.trim().replace(/\s+/g, " ");
  return t.length >= min && t.length <= max ? t : null;
}

function inteiroPositivo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor > 0 ? valor : null;
}

function valorEmReais(valor: unknown): number | null {
  if (typeof valor !== "string") return null;
  const centavos = lerReais(valor);
  return centavos !== null && centavos > 0 ? centavos : null;
}

const servicoValido = (valor: unknown) => SERVICOS.some((s) => s.id === valor);

export function validarNovaDiagnostica(corpo: unknown): Validado<NovaDiagnostica> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const empresa = textoEntre(corpo.empresa, 2, 120);
  if (!empresa) return { ok: false, mensagem: "Informe a empresa (de 2 a 120 caracteres)." };
  const contato = textoEntre(corpo.contato, 2, 120);
  if (!contato) return { ok: false, mensagem: "Informe o contato (de 2 a 120 caracteres)." };
  const telefone = typeof corpo.telefone === "string" ? corpo.telefone.trim() : "";
  if (telefone.replace(/\D/g, "").length < 8) return { ok: false, mensagem: "Confira o telefone (com DDD)." };
  const email = typeof corpo.email === "string" ? normalizarEmail(corpo.email) : "";
  if (email && (!FORMATO_EMAIL.test(email) || email.includes(".."))) return { ok: false, mensagem: MENSAGEM.email };
  if (!servicoValido(corpo.servico)) return { ok: false, mensagem: "Escolha um serviço da lista." };
  const closerId = inteiroPositivo(corpo.closerId);
  if (!closerId) return { ok: false, mensagem: "Escolha o closer." };
  if (typeof corpo.dataHora !== "string" || !DIA_E_HORA.test(corpo.dataHora) || Number.isNaN(Date.parse(`${corpo.dataHora}:00-03:00`))) {
    return { ok: false, mensagem: "Informe a data e a hora da reunião." };
  }
  if (corpo.formato !== "online" && corpo.formato !== "presencial") return { ok: false, mensagem: "Escolha online ou presencial." };
  return {
    ok: true,
    dados: {
      empresa,
      contato,
      telefone,
      email,
      cidade: textoEntre(corpo.cidade, 0, 120) ?? "",
      segmento: textoEntre(corpo.segmento, 0, 120) ?? "",
      servico: corpo.servico as string,
      closerId,
      dataHora: corpo.dataHora,
      formato: corpo.formato,
    },
  };
}

export function validarNovaProposta(corpo: unknown, hoje: string): Validado<NovaProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const oportunidadeId = corpo.oportunidadeId === undefined || corpo.oportunidadeId === null ? undefined : inteiroPositivo(corpo.oportunidadeId);
  if (oportunidadeId === null) return { ok: false, mensagem: "Oportunidade inválida." };
  const empresa = oportunidadeId ? undefined : textoEntre(corpo.empresa, 2, 120);
  if (empresa === null) return { ok: false, mensagem: "Informe a empresa (de 2 a 120 caracteres)." };
  if (!servicoValido(corpo.servico)) return { ok: false, mensagem: "Escolha um serviço da lista." };
  const valor = valorEmReais(corpo.valor);
  if (!valor) return { ok: false, mensagem: "Informe o valor da proposta em reais (por exemplo, 12.500,00)." };
  if (!diaValido(corpo.apresentadaEm) || corpo.apresentadaEm > hoje) {
    return { ok: false, mensagem: "Informe a data em que a proposta foi apresentada (hoje ou antes)." };
  }
  const dataDecisao = corpo.dataDecisao ? (diaValido(corpo.dataDecisao) ? corpo.dataDecisao : null) : undefined;
  if (dataDecisao === null) return { ok: false, mensagem: "Confira a data combinada para a decisão." };
  const validade = corpo.validade ? (diaValido(corpo.validade) ? corpo.validade : null) : undefined;
  if (validade === null) return { ok: false, mensagem: "Confira a validade da proposta." };
  const quemDecide = textoEntre(corpo.quemDecide, 2, 120);
  if (!quemDecide) return { ok: false, mensagem: "Informe quem decide." };
  return {
    ok: true,
    dados: {
      oportunidadeId,
      empresa,
      contato: textoEntre(corpo.contato, 0, 120) ?? "",
      telefone: textoEntre(corpo.telefone, 0, 40) ?? "",
      servico: corpo.servico as string,
      valor,
      apresentadaEm: corpo.apresentadaEm,
      dataDecisao,
      quemDecide,
      dor: textoEntre(corpo.dor, 0, 500) ?? "",
      validade,
    },
  };
}

export function validarResultado(corpo: unknown): Validado<ResultadoProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (corpo.resultado === "ganha") {
    const valor = valorEmReais(corpo.valor);
    return valor ? { ok: true, dados: { resultado: "ganha", valor } } : { ok: false, mensagem: "Informe o valor fechado." };
  }
  if (corpo.resultado === "perdida") {
    return typeof corpo.motivo === "string" && MOTIVOS_PERDA.includes(corpo.motivo)
      ? { ok: true, dados: { resultado: "perdida", motivo: corpo.motivo } }
      : { ok: false, mensagem: "Escolha o motivo." };
  }
  if (corpo.resultado === "nutricao") return { ok: true, dados: { resultado: "nutricao" } };
  return { ok: false, mensagem: "Escolha o resultado: ganha, perdida ou nutrição." };
}

export function validarToque(corpo: unknown): Validado<{ canal: string; resultado: string }> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (!CANAIS_DE_TOQUE.includes(corpo.canal as never)) return { ok: false, mensagem: "Escolha o canal." };
  const resultado = textoEntre(corpo.resultado, 1, 500);
  if (!resultado) return { ok: false, mensagem: "Conte em uma frase como foi o toque." };
  return { ok: true, dados: { canal: corpo.canal as string, resultado } };
}

export function validarLigacao(corpo: unknown): Validado<ResultadoLigacao> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const r = corpo.resultado;
  return r === "nao_atendeu" || r === "atendeu" || r === "marcou" ? { ok: true, dados: r } : { ok: false, mensagem: "Resultado da ligação inválido." };
}

export function validarFeito(corpo: unknown): Validado<boolean> {
  return ehObjeto(corpo) && typeof corpo.feito === "boolean" ? { ok: true, dados: corpo.feito } : { ok: false, mensagem: MENSAGEM.corpo };
}

// Fase 3 ------------------------------------------------------------------------

const MARCACOES: Marcacao[] = ["objecao", "tecnico", "escopo", "proximo_passo"];

export function validarRespostas(corpo: unknown): Validado<{ perguntaId: string; resposta: string }[]> {
  if (!ehObjeto(corpo) || !Array.isArray(corpo.respostas)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (corpo.respostas.length > 200) return { ok: false, mensagem: "Respostas demais num pedido só." };
  const lista: { perguntaId: string; resposta: string }[] = [];
  for (const r of corpo.respostas) {
    if (!ehObjeto(r) || typeof r.perguntaId !== "string" || !r.perguntaId || r.perguntaId.length > 60 || typeof r.resposta !== "string") {
      return { ok: false, mensagem: MENSAGEM.corpo };
    }
    if (r.resposta.length > 2000) return { ok: false, mensagem: "Cada resposta tem até 2.000 caracteres." };
    lista.push({ perguntaId: r.perguntaId, resposta: r.resposta });
  }
  return { ok: true, dados: lista };
}

export function validarAnotacao(corpo: unknown): Validado<Anotacao> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const { idCliente, minuto, passo, marcacao, texto } = corpo;
  if (typeof idCliente !== "string" || !idCliente || idCliente.length > 80) return { ok: false, mensagem: MENSAGEM.corpo };
  if (typeof minuto !== "number" || !Number.isInteger(minuto) || minuto < 0) return { ok: false, mensagem: MENSAGEM.corpo };
  if (marcacao !== null && marcacao !== undefined && !MARCACOES.includes(marcacao as Marcacao)) return { ok: false, mensagem: "Marcação inválida." };
  const t = typeof texto === "string" ? texto.trim() : "";
  if (!t || t.length > 2000) return { ok: false, mensagem: "Escreva a anotação (até 2.000 caracteres)." };
  return {
    ok: true,
    dados: { idCliente, minuto, passo: typeof passo === "string" ? passo.slice(0, 60) : "", marcacao: (marcacao as Marcacao | undefined) ?? null, texto: t },
  };
}

export function validarFechamento(corpo: unknown): Validado<FechamentoDiagnostica> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (corpo.resultado === "proposta_marcada") {
    if (typeof corpo.dataHora !== "string" || !DIA_E_HORA.test(corpo.dataHora) || Number.isNaN(Date.parse(`${corpo.dataHora}:00-03:00`))) {
      return { ok: false, mensagem: "Informe a data e a hora da apresentação da proposta." };
    }
    if (corpo.formato !== "online" && corpo.formato !== "presencial") return { ok: false, mensagem: "Escolha online ou presencial." };
    const quemDecide = textoEntre(corpo.quemDecide, 2, 120);
    if (!quemDecide) return { ok: false, mensagem: "Informe quem decide." };
    return { ok: true, dados: { resultado: "proposta_marcada", dataHora: corpo.dataHora, formato: corpo.formato, quemDecide } };
  }
  if (corpo.resultado === "nao_qualificou") {
    return typeof corpo.motivo === "string" && MOTIVOS_NAO_QUALIFICOU.includes(corpo.motivo)
      ? { ok: true, dados: { resultado: "nao_qualificou", motivo: corpo.motivo } }
      : { ok: false, mensagem: "Escolha o motivo." };
  }
  return { ok: false, mensagem: "Escolha como a diagnóstica terminou." };
}

// Fase 4 ------------------------------------------------------------------------

const IDS_SLIDE = slidesDaProposta().map((s) => s.id);
const inteiroEntre = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
/** Texto que pode ter quebras de linha (escopo, o que fica com o cliente). */
const textoLivre = (v: unknown, max: number): string | null => (typeof v === "string" && v.length <= max ? v.trim() : null);

export function validarVariaveis(corpo: unknown): Validado<VariaveisProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (typeof corpo.servico !== "string" || !SERVICOS.some((s) => s.id === corpo.servico)) return { ok: false, mensagem: "Escolha um serviço da lista." };
  const escopo = textoLivre(corpo.escopo, 2000);
  const ficaComCliente = textoLivre(corpo.ficaComCliente, 2000);
  if (escopo === null || ficaComCliente === null) return { ok: false, mensagem: "O escopo e o que fica com o cliente têm até 2.000 caracteres." };
  const prazo = textoLivre(corpo.prazo, 500);
  const condicoes = textoLivre(corpo.condicoes, 500);
  const equipe = textoLivre(corpo.equipe, 500);
  if (prazo === null || condicoes === null || equipe === null) return { ok: false, mensagem: "Prazo, condições e time têm até 500 caracteres." };
  if (corpo.valor !== null && !inteiroEntre(corpo.valor, 1, 10_000_000_000)) return { ok: false, mensagem: "Confira o valor." };
  if (!inteiroEntre(corpo.parcelas, 1, 12)) return { ok: false, mensagem: "As parcelas vão de 1 a 12." };
  return { ok: true, dados: { servico: corpo.servico, escopo, ficaComCliente, valor: corpo.valor as number | null, parcelas: corpo.parcelas, prazo, condicoes, equipe } };
}

export function validarAndamento(corpo: unknown): Validado<Andamento> {
  if (!ehObjeto(corpo) || !Array.isArray(corpo.sala) || !Array.isArray(corpo.pactos) || !ehObjeto(corpo.tempos)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (corpo.sala.length > 12) return { ok: false, mensagem: "No máximo 12 pessoas na sala." };
  const sala: PessoaNaSala[] = [];
  for (const p of corpo.sala) {
    const nome = ehObjeto(p) ? textoEntre(p.nome, 1, 80) : null;
    if (!ehObjeto(p) || !nome || typeof p.decide !== "boolean") return { ok: false, mensagem: "Confira quem está na sala." };
    sala.push({ nome, decide: p.decide });
  }
  const pactos: { id: IdPacto; minuto: number }[] = [];
  for (const p of corpo.pactos) {
    if (!ehObjeto(p) || !IDS_PACTO.includes(p.id as IdPacto) || !inteiroEntre(p.minuto, 0, 600) || pactos.some((x) => x.id === p.id)) {
      return { ok: false, mensagem: "Pacto inválido." };
    }
    pactos.push({ id: p.id as IdPacto, minuto: p.minuto });
  }
  const tempos: Record<string, number> = {};
  for (const [id, segundos] of Object.entries(corpo.tempos)) {
    if (!IDS_SLIDE.includes(id) || !inteiroEntre(segundos, 0, 36_000)) return { ok: false, mensagem: "Tempo de slide inválido." };
    tempos[id] = segundos;
  }
  if (!inteiroEntre(corpo.slide, 0, IDS_SLIDE.length - 1)) return { ok: false, mensagem: "Slide inválido." };
  return { ok: true, dados: { sala, pactos, tempos, slide: corpo.slide } };
}

export function validarFechamentoProposta(corpo: unknown, hoje: string = hojeEmSaoPaulo()): Validado<FechamentoProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const d = corpo.desfecho;
  if (d !== "ganho" && d !== "decidir" && d !== "ajuste" && d !== "perdido") return { ok: false, mensagem: "Escolha como a reunião terminou." };
  if (!inteiroEntre(corpo.valor, 1, 10_000_000_000)) return { ok: false, mensagem: "Informe o valor apresentado." };
  const valor = corpo.valor;
  if (d === "ganho") return { ok: true, dados: { desfecho: d, valor } };
  if (d === "perdido") {
    return typeof corpo.motivo === "string" && MOTIVOS_PERDA.includes(corpo.motivo)
      ? { ok: true, dados: { desfecho: d, valor, motivo: corpo.motivo } }
      : { ok: false, mensagem: "Escolha o motivo." };
  }
  if (!diaValido(corpo.dataDecisao)) return { ok: false, mensagem: "Informe a data da decisão." };
  if (corpo.dataDecisao < hoje) return { ok: false, mensagem: "A data da decisão não pode ser antes de hoje." };
  const quemDecide = textoEntre(corpo.quemDecide, 2, 120);
  if (!quemDecide) return { ok: false, mensagem: "Informe quem decide." };
  const observacao = textoEntre(corpo.observacao, 0, 500);
  if (observacao === null) return { ok: false, mensagem: "O que ajustar tem até 500 caracteres." };
  return { ok: true, dados: { desfecho: d, valor, dataDecisao: corpo.dataDecisao, quemDecide, ...(observacao ? { observacao } : {}) } };
}
