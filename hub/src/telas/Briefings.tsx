import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { formatarDia } from "../../compartilhado/datas";
import type { Pendencia, PendenciaDeProjetos, Reuniao } from "../../compartilhado/oportunidade";
import { api } from "../api/cliente";
import AreaDeTexto from "../componentes/AreaDeTexto";
import { avisar } from "../componentes/Aviso";
import Botao from "../componentes/Botao";
import Foco from "../componentes/Foco";
import Painel from "../componentes/Painel";
import Tag from "../componentes/Tag";
import { mensagemDe } from "./followup/comum";
import estilos from "./Briefings.module.css";

const ROTULO_ESTADO: Record<PendenciaDeProjetos["estado"], string> = {
  atrasada: "Atrasada",
  hoje: "Vence hoje",
  no_prazo: "No prazo",
  respondida: "Respondida",
};

/** A resposta da pendência em modo foco: a dúvida, de onde veio e o campo da resposta. */
function ResponderEmFoco({ item, aoResponder }: { item: PendenciaDeProjetos; aoResponder: () => void }) {
  const [resposta, setResposta] = useState(item.pendencia.resposta ?? "");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!resposta.trim()) return setErro("Escreva a resposta.");
    setEnviando(true);
    try {
      await api<Pendencia>(`/api/pendencias/${item.pendencia.id}/responder`, { method: "POST", body: JSON.stringify({ resposta: resposta.trim() }) });
      avisar("Resposta enviada. O closer vê no follow-up.");
      aoResponder();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={estilos.foco} onSubmit={enviar} noValidate>
      <p className="suave">
        Prazo {formatarDia(item.pendencia.prazo)}
        {item.reuniaoId && (
          <>
            {" · "}
            <Link to={`/reunioes/${item.reuniaoId}/briefing`}>ver o briefing</Link>
          </>
        )}
      </p>
      <h2>{item.pendencia.texto}</h2>
      <AreaDeTexto rotulo="Resposta" rows={5} maxLength={2000} value={resposta} onChange={(e) => setResposta(e.target.value)} autoFocus />
      {erro && <p role="alert">{erro}</p>}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Enviar resposta
      </Botao>
    </form>
  );
}

/** Briefings: os enviados para Projetos e as dúvidas técnicas com prazo (spec, seção 5). */
export default function Briefings() {
  const [briefings, setBriefings] = useState<Reuniao[] | null>(null);
  const [pendencias, setPendencias] = useState<PendenciaDeProjetos[] | null>(null);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<{ item: PendenciaDeProjetos; origem: HTMLElement } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([api<Reuniao[]>("/api/briefings"), api<PendenciaDeProjetos[]>("/api/pendencias")]);
      setBriefings(b);
      setPendencias(p);
      setErro("");
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function fechar(item: PendenciaDeProjetos) {
    try {
      await api(`/api/pendencias/${item.pendencia.id}/fechar`, { method: "POST" });
      avisar("Pendência fechada.");
      await carregar();
    } catch (e) {
      avisar(mensagemDe(e));
    }
  }

  return (
    <div className={estilos.briefings}>
      <header className={estilos.cabeca}>
        <h1>Briefings</h1>
        <p className="suave">O que o comercial mandou para Projetos e as dúvidas técnicas que esperam resposta.</p>
      </header>

      {erro && <p role="alert">{erro}</p>}

      <Painel>
        <h2 className={estilos.subtitulo}>Pendências técnicas</h2>
        {pendencias === null ? (
          <p className="mono suave">Carregando…</p>
        ) : pendencias.length === 0 ? (
          <p className="suave">Nenhuma dúvida técnica esperando resposta.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Pendências técnicas">
            {pendencias.map((p) => (
              <li key={p.pendencia.id} className={estilos.pendencia}>
                <div>
                  <p>{p.pendencia.texto}</p>
                  <p className="suave">
                    {p.empresa} · prazo {formatarDia(p.pendencia.prazo)}
                    {p.pendencia.resposta ? ` · ${p.pendencia.resposta}` : ""}
                  </p>
                </div>
                <Tag tipo={p.estado === "atrasada" ? "atrasado" : p.estado === "hoje" ? "hoje" : "neutro"}>{ROTULO_ESTADO[p.estado]}</Tag>
                {p.estado === "respondida" ? (
                  <Botao variante="fantasma" aria-label={`Fechar: ${p.pendencia.texto}`} onClick={() => fechar(p)}>
                    Fechar
                  </Botao>
                ) : (
                  <Botao aria-label={`Responder: ${p.pendencia.texto}`} onClick={(e) => setAberta({ item: p, origem: e.currentTarget })}>
                    Responder
                  </Botao>
                )}
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Painel>
        <h2 className={estilos.subtitulo}>Briefings enviados</h2>
        {briefings === null ? (
          <p className="mono suave">Carregando…</p>
        ) : briefings.length === 0 ? (
          <p className="suave">Nenhum briefing enviado ainda.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Briefings enviados">
            {briefings.map((b) => (
              <li key={b.id} className={estilos.briefing}>
                <span>{b.empresa}</span>
                <span className="mono suave">Diagnóstica de {formatarDia(b.dataHora.slice(0, 10))}</span>
                <Link to={`/reunioes/${b.id}/briefing`} aria-label={`Abrir o briefing de ${b.empresa}`}>
                  Abrir o briefing
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      {aberta && (
        <Foco titulo={`Pendência · ${aberta.item.empresa}`} origem={aberta.origem} aoSair={() => setAberta(null)}>
          <ResponderEmFoco
            item={aberta.item}
            aoResponder={() => {
              setAberta(null);
              void carregar();
            }}
          />
        </Foco>
      )}
    </div>
  );
}
