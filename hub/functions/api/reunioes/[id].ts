import { acessarReuniao } from "../../../servidor/acessoReuniao";
import { fichaDaReuniao } from "../../../servidor/diagnostica";
import { json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/reunioes/:id: a ficha. Projetos lê a ficha inteira da diagnóstica (o briefing); o hunter, na proposta, vê só a reunião e a oportunidade. */
export const onRequestGet: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, false);
  if (acesso instanceof Response) return acesso;
  const leitorDoBriefing = data.pessoa.cargo === "projetos" && acesso.reuniao.tipo === "diagnostica";
  if (!acesso.dono && !leitorDoBriefing) return json({ reuniao: acesso.reuniao, oportunidade: acesso.oportunidade });
  return json(await fichaDaReuniao(env.DB, acesso.reuniao.id));
};
