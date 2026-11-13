import { useEffect, useState } from "react";
import { Link } from "react-router";
import { META_CONEXOES_SEMANA } from "../../../compartilhado/dados/rotinas";
import { formatarDia, formatarReais } from "../../../compartilhado/datas";
import type { NumerosDoTime } from "../../../compartilhado/numeros";
import type { ResumoPessoa, Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import NumeroRolante from "../../componentes/NumeroRolante";
import Painel from "../../componentes/Painel";
import { RotinaDoTime } from "../Rotinas";
import { mensagemDe } from "../followup/comum";
import { formatarPercentual } from "../time/numeros";
import { primeiroNome } from "./comum";
import estilos from "./hoje.module.css";

/** Hoje do diretor: rotina do time, atrasados por pessoa, reuniões da semana e os números do mês. */
export default function HojeDiretor() {
  const [resumo, setResumo] = useState<{ pessoas: ResumoPessoa[]; reunioesDaSemana: Reuniao[] } | null>(null);
  const [erro, setErro] = useState("");

  const [numeros, setNumeros] = useState<NumerosDoTime | null>(null);

  useEffect(() => {
    api<NumerosDoTime>("/api/time/numeros")
      .then(setNumeros)
      .catch(() => undefined);
    api<{ pessoas: ResumoPessoa[]; reunioesDaSemana: Reuniao[] }>("/api/time/resumo")
      .then(setResumo)
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!resumo) return <p className="mono suave">Carregando o time…</p>;

  const atrasados = resumo.pessoas.filter((p) => p.atrasados > 0).sort((a, b) => b.atrasados - a.atrasados);

  return (
    <div className={estilos.colunas}>
      <Painel className={estilos.largo}>
        <h2 className={estilos.subtitulo}>Rotina do time hoje</h2>
        <RotinaDoTime pessoas={resumo.pessoas} />
      </Painel>

      {(() => {
        const hunters = resumo.pessoas.filter((p) => p.conexoesSemana !== undefined);
        if (hunters.length === 0) return null;
        return (
          <Painel>
            <h2 className={estilos.subtitulo}>Conexões da semana</h2>
            <ul className={estilos.conexoes} aria-label="Conexões da semana por hunter">
              {hunters.map((p) => (
                <li key={p.pessoa.id}>
                  <span>{p.pessoa.nome}</span>{" "}
                  <span className={`mono ${p.conexoesSemana! >= META_CONEXOES_SEMANA ? "" : "suave"}`}>
                    {p.conexoesSemana} de {META_CONEXOES_SEMANA}
                  </span>
                </li>
              ))}
            </ul>
          </Painel>
        );
      })()}

      <Painel>
        <h2 className={estilos.subtitulo}>Follow-ups atrasados por pessoa</h2>
        {atrasados.length === 0 ? (
          <p className="suave">Ninguém com follow-up atrasado.</p>
        ) : (
          <ul className={estilos.atrasados} aria-label="Follow-ups atrasados por pessoa">
            {atrasados.map((p) => (
              <li key={p.pessoa.id}>{`${primeiroNome(p.pessoa.nome)} · ${p.atrasados}`}</li>
            ))}
          </ul>
        )}
      </Painel>

      <Painel>
        <h2 className={estilos.subtitulo}>Reuniões da semana</h2>
        {resumo.reunioesDaSemana.length === 0 ? (
          <p className="suave">Nenhuma reunião nos próximos 7 dias.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Reuniões da semana">
            {resumo.reunioesDaSemana.map((r) => (
              <li key={r.id}>
                <span className="mono">
                  {formatarDia(r.dataHora.slice(0, 10))} · {r.dataHora.slice(11, 16)}
                </span>
                <span>
                  {r.empresa} <span className="suave">· {r.tipo === "diagnostica" ? "diagnóstica" : "proposta"}</span>
                </span>
                <span className="suave">{r.closerNome ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Painel className={estilos.largo}>
        <section aria-label="Este mês">
          <h2 className={estilos.subtitulo}>Este mês</h2>
          {numeros ? (
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
            </dl>
          ) : (
            <p className="mono suave">Carregando os números…</p>
          )}
          <p className="suave">
            O detalhe por closer, a rotina de cada pessoa e as objeções estão em <Link to="/time">Time, na aba Mês</Link>.
          </p>
        </section>
      </Painel>
    </div>
  );
}
