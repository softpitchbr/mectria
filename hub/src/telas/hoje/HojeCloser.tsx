import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { diasDepois, formatarDia, hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { ROTULO_TOQUE } from "../../../compartilhado/cadencia";
import type { ItemFollowup, Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import Botao from "../../componentes/Botao";
import Medidor from "../../componentes/Medidor";
import NumeroRolante from "../../componentes/NumeroRolante";
import Painel from "../../componentes/Painel";
import Tag from "../../componentes/Tag";
import { ChecklistDaRotina, percentualDaRotina, useRotinaDeHoje } from "../Rotinas";
import { proximaReuniao, quantoFalta } from "./comum";
import estilos from "./hoje.module.css";

type NumerosDoMes = { propostas: number; ganhas: number; pactosPorReuniao?: number | null };
const UMA_CASA = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function ProximaReuniao({ reuniao }: { reuniao: Reuniao }) {
  const navegar = useNavigate();
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
        <Botao variante="primario" onClick={() => navegar(`/reunioes/${reuniao.id}/${reuniao.tipo}`)}>
          {reuniao.situacao === "em_andamento" ? "Continuar reunião" : "Iniciar reunião"}
        </Botao>
      </div>
    </section>
  );
}

/** Hoje do closer: próxima reunião, rotina, follow-ups e os números do mês. */
export default function HojeCloser() {
  const [reunioes, setReunioes] = useState<Reuniao[] | null>(null);
  const [followups, setFollowups] = useState<ItemFollowup[]>([]);
  const [numeros, setNumeros] = useState<NumerosDoMes | null>(null);
  const rotina = useRotinaDeHoje();

  useEffect(() => {
    // Desde uma semana atrás: a reunião começada e não fechada continua como a próxima.
    const hoje = hojeEmSaoPaulo();
    api<Reuniao[]>(`/api/reunioes?de=${diasDepois(hoje, -7)}&ate=${diasDepois(hoje, 6)}`)
      .then(setReunioes)
      .catch(() => setReunioes([]));
    api<ItemFollowup[]>("/api/followup")
      .then(setFollowups)
      .catch(() => setFollowups([]));
    api<NumerosDoMes>("/api/numeros/mes")
      .then(setNumeros)
      .catch(() => setNumeros(null));
  }, []);

  const proxima = reunioes ? proximaReuniao(reunioes) : undefined;

  return (
    <div className={estilos.colunas}>
      <Painel className={estilos.cartaoPrincipal}>
        {proxima ? <ProximaReuniao reuniao={proxima} /> : <p className="suave">{reunioes ? "Nenhuma reunião nos próximos 7 dias." : "Carregando a agenda…"}</p>}
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
              <dd className="mono">{numeros?.pactosPorReuniao != null ? UMA_CASA.format(numeros.pactosPorReuniao) : "—"}</dd>
            </div>
          </dl>
        </section>
      </Painel>

      {rotina.dia && (
        <Painel>
          <h2 className={estilos.subtitulo}>
            Rotina de hoje{" "}
            <span className="mono suave">
              {percentualDaRotina(rotina.dia.feitos, rotina.dia.total)} · {rotina.dia.feitos}/{rotina.dia.total}
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
                <span className="mono">{f.proximo ? (ROTULO_TOQUE[f.proximo.codigo] ?? f.proximo.codigo) : "—"}</span>
                <Link to={`/follow-up?proposta=${f.proposta.id}`}>{f.oportunidade.empresa}</Link>
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
