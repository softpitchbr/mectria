import { podeMarcarDiagnostica } from "../../compartilhado/permissoes";
import { listar } from "../../servidor/pessoas";
import { erro, json } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

/** GET /api/closers: quem pode receber uma diagnóstica (closers e diretores ativos). */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeMarcarDiagnostica(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não marca diagnósticas.");
  const pessoas = await listar(env.DB);
  return json(pessoas.filter((p) => p.ativo && (p.cargo === "closer" || p.cargo === "diretor")).map((p) => ({ id: p.id, nome: p.nome })));
};
