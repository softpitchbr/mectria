import { hojeEmSaoPaulo, lerReais } from "../compartilhado/datas";
import { MOTIVOS_PERDA } from "../compartilhado/dados/cadencia";
import { DIAGNOSTICA, MOTIVOS_NAO_QUALIFICOU, type TipoPergunta } from "../compartilhado/dados/diagnostica";
import type { Anotacao, Marcacao } from "../compartilhado/diagnostica";
import {
  CANAIS_DE_TOQUE,
  type FechamentoDiagnostica,
  type NovaDiagnostica,
  type NovaProposta,
  type ResultadoLigacao,
  type ResultadoProposta,
} from "../compartilhado/oportunidade";
import { CARGOS, type Cargo } from "../compartilhado/cargos";
import { LIMITE_DA_APRESENTACAO, type DadosDoServico, type PerguntaTecnica, type SituacaoServico, type SlideDoRoteiro } from "../compartilhado/servico";
import { normalizarEmail } from "../compartilhado/texto";
import { lerInteracoes } from "../compartilhado/contrato-apresentacao";
import {
  IDS_PACTO,
  type Andamento,
  type FechamentoProposta,
  type IdPacto,
  type PessoaNaSala,
  type VariaveisProposta,
} from "../compartilhado/proposta";

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

/** Os ids aceitos vêm do banco (idsDosServicos): só os vendáveis para oportunidade nova. */
const servicoValido = (valor: unknown, servicos: ReadonlySet<string>) => typeof valor === "string" && servicos.has(valor);

export function validarNovaDiagnostica(corpo: unknown, servicos: ReadonlySet<string>): Validado<NovaDiagnostica> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const empresa = textoEntre(corpo.empresa, 2, 120);
  if (!empresa) return { ok: false, mensagem: "Informe a empresa (de 2 a 120 caracteres)." };
  const contato = textoEntre(corpo.contato, 2, 120);
  if (!contato) return { ok: false, mensagem: "Informe o contato (de 2 a 120 caracteres)." };
  const telefone = typeof corpo.telefone === "string" ? corpo.telefone.trim() : "";
  if (telefone.replace(/\D/g, "").length < 8) return { ok: false, mensagem: "Confira o telefone (com DDD)." };
  const email = typeof corpo.email === "string" ? normalizarEmail(corpo.email) : "";
  if (email && (!FORMATO_EMAIL.test(email) || email.includes(".."))) return { ok: false, mensagem: MENSAGEM.email };
  if (!servicoValido(corpo.servico, servicos)) return { ok: false, mensagem: "Escolha um serviço da lista." };
  const closerId = inteiroPositivo(corpo.closerId);
  if (!closerId) return { ok: false, mensagem: "Escolha o closer." };
  if (typeof corpo.dataHora !== "string" || !DIA_E_HORA.test(corpo.dataHora) || Number.isNaN(Date.parse(`${corpo.dataHora}:00-03:00`))) {
    return { ok: false, mensagem: "Informe a data e a hora da reunião." };
  }
  if (corpo.formato !== "online" && corpo.formato !== "presencial") return { ok: false, mensagem: "Escolha online ou presencial." };
  if (corpo.observacoes !== undefined && (typeof corpo.observacoes !== "string" || corpo.observacoes.length > 1000)) {
    return { ok: false, mensagem: "As observações vão até 1.000 caracteres." };
  }
  return {
    ok: true,
    dados: {
      ...(typeof corpo.observacoes === "string" && corpo.observacoes.trim() ? { observacoes: corpo.observacoes.trim() } : {}),
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

export function validarNovaProposta(corpo: unknown, hoje: string, servicos: ReadonlySet<string>): Validado<NovaProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const oportunidadeId = corpo.oportunidadeId === undefined || corpo.oportunidadeId === null ? undefined : inteiroPositivo(corpo.oportunidadeId);
  if (oportunidadeId === null) return { ok: false, mensagem: "Oportunidade inválida." };
  const empresa = oportunidadeId ? undefined : textoEntre(corpo.empresa, 2, 120);
  if (empresa === null) return { ok: false, mensagem: "Informe a empresa (de 2 a 120 caracteres)." };
  if (!servicoValido(corpo.servico, servicos)) return { ok: false, mensagem: "Escolha um serviço da lista." };
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

const MENSAGEM_RETOMAR = "Escolha o mês para retomar, deste mês em diante.";

/** Dia para retomar a oportunidade em nutrição: data válida, deste mês em diante. */
function retomarValido(valor: unknown, hoje: string): valor is string {
  return (
    typeof valor === "string" &&
    DIA.test(valor) &&
    !Number.isNaN(Date.parse(`${valor}T12:00:00Z`)) &&
    new Date(`${valor}T12:00:00Z`).toISOString().slice(0, 10) === valor &&
    valor.slice(0, 7) >= hoje.slice(0, 7)
  );
}

export function validarResultado(corpo: unknown, hoje: string = hojeEmSaoPaulo()): Validado<ResultadoProposta> {
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
  if (corpo.resultado === "nutricao") {
    if (corpo.retomarEm === undefined) return { ok: true, dados: { resultado: "nutricao" } };
    return retomarValido(corpo.retomarEm, hoje)
      ? { ok: true, dados: { resultado: "nutricao", retomarEm: corpo.retomarEm } }
      : { ok: false, mensagem: MENSAGEM_RETOMAR };
  }
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
  return r === "nao_atendeu" || r === "atendeu" || r === "conexao" || r === "marcou"
    ? { ok: true, dados: r }
    : { ok: false, mensagem: "Resultado da ligação inválido." };
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

export function validarFechamento(corpo: unknown, hoje: string = hojeEmSaoPaulo()): Validado<FechamentoDiagnostica> {
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
    if (typeof corpo.motivo !== "string" || !MOTIVOS_NAO_QUALIFICOU.includes(corpo.motivo)) return { ok: false, mensagem: "Escolha o motivo." };
    if (corpo.retomarEm === undefined) return { ok: true, dados: { resultado: "nao_qualificou", motivo: corpo.motivo } };
    return retomarValido(corpo.retomarEm, hoje)
      ? { ok: true, dados: { resultado: "nao_qualificou", motivo: corpo.motivo, retomarEm: corpo.retomarEm } }
      : { ok: false, mensagem: MENSAGEM_RETOMAR };
  }
  if (corpo.resultado === "nao_compareceu") return { ok: true, dados: { resultado: "nao_compareceu" } };
  return { ok: false, mensagem: "Escolha como a diagnóstica terminou." };
}

// Fase 4 ------------------------------------------------------------------------

/** Os slides vêm do roteiro de cada serviço: o andamento aceita qualquer id de slide (um roteiro editado no meio da reunião não trava a gravação). */
const ID_DE_SLIDE = /^[a-z0-9-]{1,40}$/;
const MAXIMO_DE_SLIDES = 60;
const inteiroEntre = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
/** Texto que pode ter quebras de linha (escopo, o que fica com o cliente). */
const textoLivre = (v: unknown, max: number): string | null => (typeof v === "string" && v.length <= max ? v.trim() : null);

/** servicos: todos os do banco (a proposta de um serviço que ficou inativo continua sendo preparada). */
export function validarVariaveis(corpo: unknown, servicos: ReadonlySet<string>): Validado<VariaveisProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (typeof corpo.servico !== "string" || !servicos.has(corpo.servico)) return { ok: false, mensagem: "Escolha um serviço da lista." };
  const escopo = textoLivre(corpo.escopo, 2000);
  const ficaComCliente = textoLivre(corpo.ficaComCliente, 2000);
  if (escopo === null || ficaComCliente === null) return { ok: false, mensagem: "O escopo e o que fica com o cliente têm até 2.000 caracteres." };
  const prazo = textoLivre(corpo.prazo, 500);
  const condicoes = textoLivre(corpo.condicoes, 500);
  const equipe = textoLivre(corpo.equipe, 500);
  if (prazo === null || condicoes === null || equipe === null) return { ok: false, mensagem: "Prazo, condições e time têm até 500 caracteres." };
  if (corpo.valor !== null && !inteiroEntre(corpo.valor, 1, 10_000_000_000)) return { ok: false, mensagem: "Confira o valor." };
  if (!inteiroEntre(corpo.parcelas, 1, 12)) return { ok: false, mensagem: "As parcelas vão de 1 a 12." };
  return {
    ok: true,
    dados: { servico: corpo.servico, escopo, ficaComCliente, valor: corpo.valor as number | null, parcelas: corpo.parcelas, prazo, condicoes, equipe },
  };
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
    if (!ehObjeto(p) || !IDS_PACTO.includes(p.id as IdPacto) || !inteiroEntre(p.minuto, 0, 100_000) || pactos.some((x) => x.id === p.id)) {
      return { ok: false, mensagem: "Pacto inválido." };
    }
    pactos.push({ id: p.id as IdPacto, minuto: p.minuto });
  }
  const tempos: Record<string, number> = {};
  const entradas = Object.entries(corpo.tempos);
  if (entradas.length > MAXIMO_DE_SLIDES) return { ok: false, mensagem: "Tempo de slide inválido." };
  for (const [id, segundos] of entradas) {
    if (!ID_DE_SLIDE.test(id) || !inteiroEntre(segundos, 0, 10_000_000)) return { ok: false, mensagem: "Tempo de slide inválido." };
    tempos[id] = segundos;
  }
  if (!inteiroEntre(corpo.slide, 0, MAXIMO_DE_SLIDES - 1)) return { ok: false, mensagem: "Slide inválido." };
  if (corpo.interacoes === undefined) return { ok: true, dados: { sala, pactos, tempos, slide: corpo.slide } };
  const interacoes = lerInteracoes(corpo.interacoes);
  if (!interacoes) return { ok: false, mensagem: "As interações da apresentação vieram inválidas." };
  return { ok: true, dados: { sala, pactos, tempos, slide: corpo.slide, interacoes } };
}

export function validarFechamentoProposta(corpo: unknown, hoje: string = hojeEmSaoPaulo()): Validado<FechamentoProposta> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const d = corpo.desfecho;
  if (d !== "ganho" && d !== "decidir" && d !== "ajuste" && d !== "perdido") return { ok: false, mensagem: "Escolha como a reunião terminou." };
  if (!inteiroEntre(corpo.valor, 1, 10_000_000_000)) return { ok: false, mensagem: "Informe o valor apresentado." };
  const valor = corpo.valor;
  if (d === "ganho") {
    return inteiroEntre(corpo.valorFechado, 1, 10_000_000_000)
      ? { ok: true, dados: { desfecho: d, valor, valorFechado: corpo.valorFechado } }
      : { ok: false, mensagem: "Informe o valor fechado." };
  }
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

// Fase 6 ------------------------------------------------------------------------

export function validarAdiamento(corpo: unknown, hoje: string = hojeEmSaoPaulo()): Validado<string> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  return retomarValido(corpo.retomarEm, hoje) ? { ok: true, dados: corpo.retomarEm } : { ok: false, mensagem: MENSAGEM_RETOMAR };
}

export function validarReuniaoDeReativacao(corpo: unknown): Validado<{ dataHora: string; formato: "online" | "presencial" }> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (typeof corpo.dataHora !== "string" || !DIA_E_HORA.test(corpo.dataHora) || Number.isNaN(Date.parse(`${corpo.dataHora}:00-03:00`))) {
    return { ok: false, mensagem: "Informe a data e a hora da reunião." };
  }
  if (corpo.formato !== "online" && corpo.formato !== "presencial") return { ok: false, mensagem: "Escolha online ou presencial." };
  return { ok: true, dados: { dataHora: corpo.dataHora, formato: corpo.formato } };
}

export function validarMotivoDePerda(corpo: unknown): Validado<string> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  return typeof corpo.motivo === "string" && MOTIVOS_PERDA.includes(corpo.motivo)
    ? { ok: true, dados: corpo.motivo }
    : { ok: false, mensagem: "Escolha o motivo." };
}

export function validarResposta(corpo: unknown): Validado<string> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const resposta = textoEntre(corpo.resposta, 1, 2000);
  return resposta ? { ok: true, dados: resposta } : { ok: false, mensagem: "Escreva a resposta (até 2.000 caracteres)." };
}

// Fase 7 ------------------------------------------------------------------------

export function validarConfirmacao(corpo: unknown): Validado<{ fup: 1 | 2 | 3 } | { confirmada: true }> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  if (corpo.confirmada === true) return { ok: true, dados: { confirmada: true } };
  if (corpo.fup === 1 || corpo.fup === 2 || corpo.fup === 3) return { ok: true, dados: { fup: corpo.fup } };
  return { ok: false, mensagem: "Escolha o FUP (1, 2 ou 3) ou a confirmação." };
}

// Fase 8 ------------------------------------------------------------------------

const TIPOS_DE_PERGUNTA: readonly TipoPergunta[] = ["texto", "curto", "opcoes", "numero"];
const BLOCOS_TECNICOS = ["escopo", "parametros"];
const SITUACOES_SERVICO: readonly SituacaoServico[] = ["ativo", "em_estruturacao", "inativo"];
/** As perguntas da base (GPCTBA + C&I e escopo geral): a pergunta técnica não pode ter o mesmo id. */
const IDS_DA_BASE = new Set([...DIAGNOSTICA.blocos.flatMap((b) => b.perguntas), ...DIAGNOSTICA.escopoGeral].map((p) => p.id));
const ID_PERGUNTA = /^[a-z0-9-]{1,60}$/;
const ID_SLIDE = /^[a-z0-9-]{1,40}$/;

/** Lista de itens (uma dor, uma entrega...), cada um de 1 a 200 caracteres. */
function itens(valor: unknown, max: number): string[] | null {
  if (!Array.isArray(valor) || valor.length > max) return null;
  const lista: string[] = [];
  for (const item of valor) {
    const t = textoEntre(item, 1, 200);
    if (t === null) return null;
    lista.push(t);
  }
  return lista;
}

function validarPerguntas(valor: unknown): Validado<PerguntaTecnica[]> {
  const erroP = (mensagem: string): Validado<PerguntaTecnica[]> => ({ ok: false, mensagem });
  if (!Array.isArray(valor) || valor.length > 30) return erroP("O serviço tem até 30 perguntas técnicas.");
  const perguntas: PerguntaTecnica[] = [];
  for (const p of valor) {
    if (!ehObjeto(p) || typeof p.id !== "string" || !ID_PERGUNTA.test(p.id)) return erroP("Confira as perguntas técnicas.");
    if (IDS_DA_BASE.has(p.id) || perguntas.some((x) => x.id === p.id)) return erroP("Duas perguntas com o mesmo código. Recarregue a página e tente de novo.");
    const texto = textoEntre(p.texto, 1, 300);
    if (!texto) return erroP("Cada pergunta técnica tem de 1 a 300 caracteres.");
    if (!TIPOS_DE_PERGUNTA.includes(p.tipo as TipoPergunta)) return erroP("Escolha o tipo de cada pergunta.");
    if (typeof p.bloco !== "string" || !BLOCOS_TECNICOS.includes(p.bloco)) return erroP("Escolha o bloco de cada pergunta.");
    const dica = textoEntre(p.dica, 0, 300);
    if (dica === null) return erroP("A dica da pergunta tem até 300 caracteres.");
    if (p.inativa !== undefined && typeof p.inativa !== "boolean") return erroP("Confira as perguntas técnicas.");
    const pergunta: PerguntaTecnica = { id: p.id, tipo: p.tipo as TipoPergunta, texto, bloco: p.bloco };
    if (p.tipo === "opcoes") {
      const opcoes = Array.isArray(p.opcoes) && p.opcoes.length >= 2 && p.opcoes.length <= 10 ? p.opcoes.map((o) => textoEntre(o, 1, 80)) : null;
      if (!opcoes || opcoes.some((o) => o === null)) return erroP("A pergunta de opções tem de 2 a 10 opções, cada uma com até 80 caracteres.");
      pergunta.opcoes = opcoes as string[];
    }
    if (dica) pergunta.dica = dica;
    if (p.inativa) pergunta.inativa = true;
    perguntas.push(pergunta);
  }
  return { ok: true, dados: perguntas };
}

function validarRoteiro(valor: unknown): Validado<SlideDoRoteiro[] | null> {
  if (valor === null) return { ok: true, dados: null };
  const erroR = (mensagem: string): Validado<SlideDoRoteiro[] | null> => ({ ok: false, mensagem });
  if (!Array.isArray(valor) || valor.length < 1 || valor.length > 40) return erroR("O roteiro tem de 1 a 40 slides.");
  const slides: SlideDoRoteiro[] = [];
  for (const s of valor) {
    if (!ehObjeto(s) || typeof s.id !== "string" || !ID_SLIDE.test(s.id) || slides.some((x) => x.id === s.id)) return erroR("Confira os slides do roteiro.");
    const titulo = textoEntre(s.titulo, 1, 120);
    if (!titulo) return erroR("Cada slide do roteiro tem um título de até 120 caracteres.");
    const fala = textoLivre(s.fala ?? "", 2000);
    const dica = textoLivre(s.dica ?? "", 500);
    if (fala === null || dica === null) return erroR("A fala tem até 2.000 caracteres e a dica, até 500.");
    if (s.pacto !== null && !IDS_PACTO.includes(s.pacto as IdPacto)) return erroR("Escolha o pacto do slide.");
    if (!inteiroEntre(s.tempo, 1, 30)) return erroR("O tempo do slide vai de 1 a 30 minutos.");
    slides.push({ id: s.id, titulo, fala, ...(dica ? { dica } : {}), pacto: s.pacto as IdPacto | null, tempo: s.tempo });
  }
  return { ok: true, dados: slides };
}

/** O serviço inteiro, como o diretor manda ao criar ou editar. */
export function validarServico(corpo: unknown): Validado<DadosDoServico> {
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const nome = textoEntre(corpo.nome, 2, 80);
  if (!nome) return { ok: false, mensagem: "O nome do serviço tem de 2 a 80 caracteres." };
  const sigla = typeof corpo.sigla === "string" && /^[A-Za-z0-9]{1,6}$/.test(corpo.sigla.trim()) ? corpo.sigla.trim().toUpperCase() : null;
  if (!sigla) return { ok: false, mensagem: "A sigla tem de 1 a 6 letras ou números." };
  const resumo = textoEntre(corpo.resumo, 0, 300);
  const ancoraValor = textoEntre(corpo.ancoraValor, 0, 500);
  if (resumo === null || ancoraValor === null) return { ok: false, mensagem: "O resumo tem até 300 caracteres e a âncora de valor, até 500." };
  const dores = itens(corpo.dores, 12);
  if (!dores) return { ok: false, mensagem: "O serviço tem até 12 dores, cada uma com até 200 caracteres." };
  const entregamos = itens(corpo.entregamos, 20);
  const ficaComCliente = itens(corpo.ficaComCliente, 20);
  if (!entregamos || !ficaComCliente) return { ok: false, mensagem: "O que entregamos e o que fica com o cliente têm até 20 itens, cada um com até 200 caracteres." };
  if (!SITUACOES_SERVICO.includes(corpo.situacao as SituacaoServico)) return { ok: false, mensagem: "Escolha a situação do serviço." };
  const perguntas = validarPerguntas(corpo.perguntas);
  if (!perguntas.ok) return perguntas;
  const roteiro = validarRoteiro(corpo.roteiro ?? null);
  if (!roteiro.ok) return roteiro;
  return {
    ok: true,
    dados: { nome, sigla, resumo, dores, entregamos, ficaComCliente, ancoraValor, situacao: corpo.situacao as SituacaoServico, perguntas: perguntas.dados, roteiro: roteiro.dados },
  };
}

/** O arquivo da apresentação: um .html só, com tudo dentro, até 5 MB. */
export function validarArquivoDaApresentacao(corpo: unknown): Validado<{ arquivo: string; html: string }> {
  const mensagem = "Envie um arquivo .html.";
  if (!ehObjeto(corpo)) return { ok: false, mensagem: MENSAGEM.corpo };
  const arquivo = textoEntre(corpo.arquivo, 1, 120);
  if (!arquivo || !/\.html?$/i.test(arquivo) || typeof corpo.html !== "string") return { ok: false, mensagem };
  if (new TextEncoder().encode(corpo.html).length > LIMITE_DA_APRESENTACAO) {
    return { ok: false, mensagem: "A apresentação passa de 5 MB. Diminua as imagens e envie de novo." };
  }
  if (!/<html[\s>]|<!doctype html/i.test(corpo.html)) return { ok: false, mensagem };
  return { ok: true, dados: { arquivo, html: corpo.html } };
}
