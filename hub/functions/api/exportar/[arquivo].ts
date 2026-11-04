import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { podeVerResumoDoTime } from "../../../compartilhado/permissoes";
import { csvDoHistorico, exportarTudo } from "../../../servidor/exportar";
import { erro } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function arquivo(conteudo: string, tipo: string, nome: string): Response {
  return new Response(conteudo, {
    headers: { "Content-Type": tipo, "Content-Disposition": `attachment; filename="${nome}"`, "Cache-Control": "no-store" },
  });
}

/** GET /api/exportar/historico.csv?mes=AAAA-MM e GET /api/exportar/tudo.json: as saídas do diretor (spec, seção 8). */
export const onRequestGet: PagesFunction<Env, "arquivo", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeVerResumoDoTime(data.pessoa.cargo)) return erro("sem_permissao", "Só o diretor exporta os dados.");
  if (params.arquivo === "historico.csv") {
    const mes = new URL(request.url).searchParams.get("mes") ?? hojeEmSaoPaulo().slice(0, 7);
    if (!MES.test(mes)) return erro("invalido", "Escolha o mês no formato AAAA-MM.");
    return arquivo(await csvDoHistorico(env.DB, mes), "text/csv; charset=utf-8", `historico-${mes}.csv`);
  }
  if (params.arquivo === "tudo.json") {
    return arquivo(JSON.stringify(await exportarTudo(env.DB)), "application/json; charset=utf-8", `hub-mectria-${hojeEmSaoPaulo()}.json`);
  }
  return erro("nao_encontrado", "Exportação não encontrada.");
};
