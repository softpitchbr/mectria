import { podeCuidarDoFollowup } from "../compartilhado/permissoes";
import { erro } from "./respostas";
import type { Pessoa } from "./tipos";

/** Só closer e diretor mexem na reativação; null quando pode. */
export function semPermissaoNaReativacao(pessoa: Pessoa): Response | null {
  return podeCuidarDoFollowup(pessoa.cargo) ? null : erro("sem_permissao", "Só closer e diretor mexem na reativação.");
}

/** Traduz os erros de servidor/reativacao.ts; devolve null para os que não são dela. */
export function respostaDoErroDeReativacao(e: unknown): Response | null {
  if (!(e instanceof Error)) return null;
  if (e.message === "nao_encontrado") return erro("nao_encontrado", "Oportunidade não encontrada.");
  if (e.message === "sem_permissao") return erro("sem_permissao", "Essa oportunidade é de outro closer.");
  if (e.message === "fora_da_nutricao") return erro("conflito", "Essa oportunidade não está mais em nutrição.");
  return null;
}
