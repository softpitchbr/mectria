import { podeVerResumoDoTime } from "../../../../compartilhado/permissoes";
import { apagarDadosPessoais } from "../../../../servidor/exportar";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** POST /api/oportunidades/:id/apagar-dados-pessoais: o diretor atende um pedido da LGPD. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  if (!podeVerResumoDoTime(data.pessoa.cargo)) return erro("sem_permissao", "Só o diretor apaga dados pessoais.");
  try {
    await apagarDadosPessoais(env.DB, Number(params.id), data.pessoa);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "nao_encontrado") return erro("nao_encontrado", "Oportunidade não encontrada.");
    throw e;
  }
};
