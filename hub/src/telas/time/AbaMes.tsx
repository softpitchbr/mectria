import { useEffect, useState } from "react";
import { formatarDia, formatarReais, hojeEmSaoPaulo } from "../../../compartilhado/datas";
import type { NumerosDoTime } from "../../../compartilhado/numeros";
import { api } from "../../api/cliente";
import NumeroRolante from "../../componentes/NumeroRolante";
import Painel from "../../componentes/Painel";
import Selecao from "../../componentes/Selecao";
import { mensagemDe } from "../followup/comum";
import { formatarPercentual, ultimosMeses } from "./numeros";
import estilos from "./AbaMes.module.css";

const UMA_CASA = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Aba Mês da seção Time: os números do mês, por closer, a rotina de cada pessoa e as objeções. */
export default function AbaMes() {
  const [meses] = useState(() => ultimosMeses(hojeEmSaoPaulo()));
  const [mes, setMes] = useState(meses[0].valor);
  const [numeros, setNumeros] = useState<NumerosDoTime | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    setErro("");
    api<NumerosDoTime>(`/api/time/numeros?mes=${mes}`)
      .then((n) => vivo && setNumeros(n))
      .catch((e: unknown) => vivo && setErro(mensagemDe(e)));
    return () => {
      vivo = false;
    };
  }, [mes]);

  return (
    <div className={estilos.mes}>
      <div className={estilos.topo}>
        <Selecao rotulo="Mês" opcoes={meses} value={mes} onChange={(e) => setMes(e.target.value)} className={estilos.seletor} />
        <a className={estilos.baixar} href={`/api/exportar/historico.csv?mes=${mes}`} download>
          Baixar o histórico do mês (CSV)
        </a>
        <a className={estilos.baixar} href="/api/exportar/tudo.json" download>
          Baixar todos os dados (JSON)
        </a>
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!numeros && !erro && <p className="mono suave">Carregando os números…</p>}

      {numeros && (
        <>
          <Painel>
            <section aria-label="Resumo do mês">
              <dl className={estilos.numeros}>
                <div>
                  <dt className="suave">Propostas</dt>
                  <dd>
                    <NumeroRolante valor={numeros.propostas} />
                  </dd>
                </div>
                <div>
                  <dt className="suave">Fechadas</dt>
                  <dd>
                    <NumeroRolante valor={numeros.ganhas} />
                  </dd>
                </div>
                <div>
                  <dt className="suave">Conversão</dt>
                  <dd className="mono">{formatarPercentual(numeros.conversao)}</dd>
                </div>
                <div>
                  <dt className="suave">Valor vendido</dt>
                  <dd className="mono">{formatarReais(numeros.valorVendido)}</dd>
                </div>
                <div>
                  <dt className="suave">Da diagnóstica à decisão</dt>
                  <dd className="mono">{numeros.tempoMedioDias === null ? "—" : `${UMA_CASA.format(numeros.tempoMedioDias)} dias`}</dd>
                </div>
                <div>
                  <dt className="suave">Pactos por reunião</dt>
                  <dd className="mono">{numeros.pactosPorReuniao === null ? "—" : UMA_CASA.format(numeros.pactosPorReuniao)}</dd>
                </div>
              </dl>
            </section>
          </Painel>

          <Painel>
            <h2 className={estilos.subtitulo}>Por closer</h2>
            {numeros.porCloser.length === 0 ? (
              <p className="suave">Nenhum closer ativo.</p>
            ) : (
              <table className={estilos.tabela} aria-label="Números por closer">
                <thead>
                  <tr>
                    <th scope="col">Closer</th>
                    <th scope="col">Propostas</th>
                    <th scope="col">Fechadas</th>
                    <th scope="col">Valor vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {numeros.porCloser.map((c) => (
                    <tr key={c.pessoa.id}>
                      <th scope="row">{c.pessoa.nome}</th>
                      <td className="mono">{c.propostas}</td>
                      <td className="mono">{c.ganhas}</td>
                      <td className="mono">{formatarReais(c.valorVendido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Painel>

          <Painel>
            <h2 className={estilos.subtitulo}>Rotina no mês</h2>
            <ul className={estilos.lista} aria-label="Rotina no mês">
              {numeros.rotina.map((r) => (
                <li key={r.pessoa.id}>
                  <span>{r.pessoa.nome}</span>
                  {r.total === 0 ? (
                    <span className="suave">não abriu a rotina</span>
                  ) : (
                    <span className="mono">
                      {formatarPercentual(r.feitos / r.total)}{" "}
                      <span className="suave">
                        ({r.feitos} de {r.total})
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Painel>

          <Painel>
            <h2 className={estilos.subtitulo}>Objeções do mês</h2>
            {numeros.objecoes.length === 0 ? (
              <p className="suave">Nenhuma anotação marcada como objeção neste mês.</p>
            ) : (
              <ul className={estilos.objecoes} aria-label="Objeções do mês">
                {numeros.objecoes.map((o, i) => (
                  <li key={i}>
                    <p>{o.texto}</p>
                    <p className="suave">
                      {o.empresa}
                      {o.closer ? ` · ${o.closer}` : ""} · {formatarDia(o.dia)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Painel>
        </>
      )}
    </div>
  );
}
