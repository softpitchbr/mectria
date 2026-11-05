import { diasDepois, hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { podeVerResumoDoTime } from "../../../compartilhado/permissoes";
import { listarReunioes } from "../../../servidor/oportunidades";
import { erro, json } from "../../../servidor/respostas";
import { resumoDoTime } from "../../../servidor/rotina";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/time/resumo: rotina e atrasados de cada pessoa, e as reuniões dos próximos 7 dias. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeVerResumoDoTime(data.pessoa.cargo)) return erro("sem_permissao", "O resumo do time é do diretor comercial.");
  const hoje = hojeEmSaoPaulo();
  const [pessoas, reunioesDaSemana] = await Promise.all([resumoDoTime(env.DB, hoje), listarReunioes(env.DB, hoje, diasDepois(hoje, 6))]);
  return json({ pessoas, reunioesDaSemana });
};
