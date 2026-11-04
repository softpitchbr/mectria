import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { podeVerResumoDoTime } from "../../../compartilhado/permissoes";
import { numerosDoTime } from "../../../servidor/numeros";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** GET /api/time/numeros?mes=AAAA-MM: os números do mês para o diretor (padrão: o mês atual). */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  if (!podeVerResumoDoTime(data.pessoa.cargo)) return erro("sem_permissao", "Os números do time são do diretor comercial.");
  const mes = new URL(request.url).searchParams.get("mes") ?? hojeEmSaoPaulo().slice(0, 7);
  if (!MES.test(mes)) return erro("invalido", "Escolha o mês no formato AAAA-MM.");
  return json(await numerosDoTime(env.DB, mes));
};
