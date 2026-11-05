import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatarDia } from "../../../compartilhado/datas";
import type { PendenciaDeProjetos, Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import Painel from "../../componentes/Painel";
import Tag from "../../componentes/Tag";
import { mensagemDe } from "../followup/comum";
import estilos from "./hoje.module.css";

/** Hoje de Projetos: os briefings mais novos e as dúvidas técnicas abertas, com o prazo. */
export default function HojeProjetos() {
  const [briefings, setBriefings] = useState<Reuniao[] | null>(null);
  const [pendencias, setPendencias] = useState<PendenciaDeProjetos[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([api<Reuniao[]>("/api/briefings"), api<PendenciaDeProjetos[]>("/api/pendencias")])
      .then(([b, p]) => {
        setBriefings(b.slice(0, 5));
        setPendencias(p.filter((x) => x.estado !== "respondida"));
      })
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!briefings || !pendencias) return <p className="mono suave">Carregando…</p>;

  return (
    <div className={estilos.colunas}>
      <Painel>
        <h2 className={estilos.subtitulo}>Pendências abertas</h2>
        {pendencias.length === 0 ? (
          <p className="suave">Nenhuma dúvida técnica esperando resposta.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Pendências abertas">
            {pendencias.map((p) => (
              <li key={p.pendencia.id}>
                <span>{p.pendencia.texto}</span>
                <span className="suave">{p.empresa}</span>
                {p.estado === "atrasada" ? <Tag tipo="atrasado">Atrasada</Tag> : <span className="mono suave">{formatarDia(p.pendencia.prazo)}</span>}
              </li>
            ))}
          </ul>
        )}
        <Link to="/briefings">Responder em Briefings</Link>
      </Painel>

      <Painel>
        <h2 className={estilos.subtitulo}>Briefings novos</h2>
        {briefings.length === 0 ? (
          <p className="suave">Nenhum briefing enviado ainda.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Briefings novos">
            {briefings.map((b) => (
              <li key={b.id}>
                <Link to={`/reunioes/${b.id}/briefing`}>{b.empresa}</Link>
                <span className="mono suave">{formatarDia(b.dataHora.slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </div>
  );
}
