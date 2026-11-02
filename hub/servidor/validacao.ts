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
  if (!FORMATO_EMAIL.test(email)) return { ok: false, mensagem: MENSAGEM.email };
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
