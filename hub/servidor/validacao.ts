import { lerReais } from "../compartilhado/datas";
import { MOTIVOS_PERDA } from "../compartilhado/dados/cadencia";
import { SERVICOS } from "../compartilhado/dados/servicos";
import { CANAIS_DE_TOQUE, type NovaDiagnostica, type NovaProposta, type ResultadoLigacao, type ResultadoProposta } from "../compartilhado/oportunidade";
import { CARGOS, type Cargo } from "../compartilhado/cargos";
import { normalizarEmail } from "../compartilhado/texto";

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
