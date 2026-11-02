import { normalizarEmail } from "../../compartilhado/texto";
import { emailDaRequisicao } from "../../servidor/identidade";
import { pedidoDeOutroSite } from "../../servidor/protecao";
import { buscarPorEmail, contarDiretoresAtivos, criar } from "../../servidor/pessoas";
import { erro } from "../../servidor/respostas";
import type { DadosApi, Env, Pessoa } from "../../servidor/tipos";

const SEM_ACESSO = "Seu e-mail não tem acesso ao hub. Fale com o diretor comercial da MecTRIA.";

/** "marcelo.silva@x" vira "Marcelo Silva": o diretor corrige depois no Time, se precisar. */
function nomeDoEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((parte) => parte[0].toUpperCase() + parte.slice(1))
    .join(" ");
}

/** Primeiro acesso com o banco sem diretor: o e-mail de DIRETOR_INICIAL vira diretor. */
async function criarDiretorInicial(env: Env, email: string): Promise<Pessoa | null> {
  if (!env.DIRETOR_INICIAL || normalizarEmail(env.DIRETOR_INICIAL) !== email) return null;
  if ((await contarDiretoresAtivos(env.DB)) > 0) return null;
  try {
    return await criar(env.DB, { nome: nomeDoEmail(email), email, cargo: "diretor" });
  } catch (e) {
    // Dois primeiros acessos ao mesmo tempo: o outro já criou.
    if (e instanceof Error && e.message === "email_duplicado") return buscarPorEmail(env.DB, email);
    throw e;
  }
}

/** Identifica a pessoa em toda chamada /api e a deixa em context.data.pessoa. */
export const onRequest: PagesFunction<Env, string, DadosApi> = async (contexto) => {
  const { request, env } = contexto;
  if (pedidoDeOutroSite(request)) return erro("sem_permissao", "Pedido recusado: ele não veio do hub.");
  const email = await emailDaRequisicao(request, env);
  if (!email) return erro("sem_identidade", "Não conseguimos identificar você. Entre de novo pelo login da MecTRIA.");

  const pessoa = (await buscarPorEmail(env.DB, email)) ?? (await criarDiretorInicial(env, email));
  if (!pessoa || !pessoa.ativo) return erro("sem_acesso", SEM_ACESSO);

  contexto.data.pessoa = pessoa;
  return contexto.next();
};
