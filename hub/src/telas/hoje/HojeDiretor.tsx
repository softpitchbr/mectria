import { useEffect, useState } from "react";
import { formatarDia } from "../../../compartilhado/datas";
import type { ResumoPessoa, Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import Painel from "../../componentes/Painel";
import { RotinaDoTime } from "../Rotinas";
import { mensagemDe } from "../followup/comum";
import { primeiroNome } from "./comum";
import estilos from "./hoje.module.css";

/** Hoje do diretor: rotina do time, atrasados por pessoa e reuniões da semana. */
export default function HojeDiretor() {
  const [resumo, setResumo] = useState<{ pessoas: ResumoPessoa[]; reunioesDaSemana: Reuniao[] } | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
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
        <p className={`mono ${estilos.sobre}`}>EM CONSTRUÇÃO</p>
        <p>Conversão e valor vendido chegam na fase 6.</p>
      </Painel>
    </div>
  );
}
