import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatarDia, instanteLocal } from "../../../compartilhado/datas";
import type { ItemFollowup, Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import Botao from "../../componentes/Botao";
import Medidor from "../../componentes/Medidor";
import NumeroRolante from "../../componentes/NumeroRolante";
import Painel from "../../componentes/Painel";
import Tag from "../../componentes/Tag";
import { ChecklistDaRotina, useRotinaDeHoje } from "../Rotinas";
import { quantoFalta } from "./comum";
import estilos from "./hoje.module.css";

function ProximaReuniao({ reuniao }: { reuniao: Reuniao }) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const falta = quantoFalta(reuniao.dataHora, agora);
  return (
    <section className={estilos.secao}>
      <p className={`mono ${estilos.sobre}`}>PRÓXIMA REUNIÃO · {reuniao.tipo === "diagnostica" ? "DIAGNÓSTICA" : "PROPOSTA"}</p>
      <h2 className={estilos.empresa}>{reuniao.empresa}</h2>
      <p className="mono suave">
        {formatarDia(reuniao.dataHora.slice(0, 10))} · {reuniao.dataHora.slice(11, 16)} · {reuniao.formato === "online" ? "online" : "presencial"}
      </p>
      <Medidor rotulo="Até a reunião" valor={Math.max(0, 1440 - falta.minutos)} total={1440} texto={falta.texto} />
      <div className={estilos.botoes}>
        <Botao variante="primario" disabled title="O modo reunião chega na fase 3">
          Iniciar reunião
        </Botao>
        <span className="suave">chega na fase 3</span>
      </div>
    </section>
  );
}

/** Hoje do closer: próxima reunião, rotina, follow-ups e os números do mês. */
export default function HojeCloser() {
  const [reunioes, setReunioes] = useState<Reuniao[] | null>(null);
  const [followups, setFollowups] = useState<ItemFollowup[]>([]);
  const [numeros, setNumeros] = useState<{ propostas: number; ganhas: number } | null>(null);
  const rotina = useRotinaDeHoje();

  useEffect(() => {
    api<Reuniao[]>("/api/reunioes")
      .then(setReunioes)
      .catch(() => setReunioes([]));
    api<ItemFollowup[]>("/api/followup")
      .then(setFollowups)
      .catch(() => setFollowups([]));
    api<{ propostas: number; ganhas: number }>("/api/numeros/mes")
      .then(setNumeros)
      .catch(() => setNumeros(null));
  }, []);

  const agora = Date.now();
  const proxima = reunioes?.find((r) => r.situacao !== "cancelada" && instanteLocal(r.dataHora).getTime() > agora);

  return (
    <div className={estilos.colunas}>
      <Painel className={estilos.cartaoPrincipal}>
        {proxima ? (
          <ProximaReuniao reuniao={proxima} />
        ) : (
          <p className="suave">{reunioes ? "Nenhuma reunião nos próximos 7 dias." : "Carregando a agenda…"}</p>
        )}
      </Painel>

      <Painel>
        <section aria-label="Este mês" className={estilos.secao}>
          <h2 className={estilos.subtitulo}>Este mês</h2>
          <dl className={estilos.numeros}>
            <div>
              <dt className="suave">Propostas</dt>
              <dd>{numeros ? <NumeroRolante valor={numeros.propostas} /> : "—"}</dd>
            </div>
            <div>
              <dt className="suave">Fechadas</dt>
              <dd>{numeros ? <NumeroRolante valor={numeros.ganhas} /> : "—"}</dd>
            </div>
            <div>
              <dt className="suave">Pactos por reunião</dt>
              <dd className="mono suave" title="Chega na fase 4">
                —
              </dd>
            </div>
          </dl>
        </section>
      </Painel>

      {rotina.dia && (
        <Painel>
          <h2 className={estilos.subtitulo}>
            Rotina de hoje{" "}
            <span className="mono suave">
              {rotina.dia.feitos}/{rotina.dia.total}
            </span>
          </h2>
          <ChecklistDaRotina dia={rotina.dia} aoMarcar={rotina.marcar} />
        </Painel>
      )}

      <Painel>
        <h2 className={estilos.subtitulo}>Follow-ups</h2>
        {followups.length === 0 ? (
          <p className="suave">Nenhuma proposta na rua.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Próximos follow-ups">
            {followups.slice(0, 5).map((f) => (
              <li key={f.proposta.id}>
                <span className="mono">{f.proximo?.codigo ?? "—"}</span>
                <Link to={f.proximo ? `/follow-up?toque=${f.proximo.id}` : "/follow-up"}>{f.oportunidade.empresa}</Link>
                {f.estado === "atrasado" ? <Tag tipo="atrasado">Atrasado</Tag> : f.estado === "hoje" ? <Tag tipo="hoje">Hoje</Tag> : <span />}
              </li>
            ))}
          </ul>
        )}
        <Link to="/follow-up" className={estilos.verTodos}>
          Ver o follow-up
        </Link>
      </Painel>
    </div>
  );
}
