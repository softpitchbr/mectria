import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { diasDepois, formatarDia, hojeEmSaoPaulo } from "../../compartilhado/datas";
import { PLAYBOOK_PROPOSTA } from "../../compartilhado/dados/playbooks";
import { oportunidadeNaEtapa, type Reuniao } from "../../compartilhado/oportunidade";
import { api } from "../api/cliente";
import Botao from "../componentes/Botao";
import Tag from "../componentes/Tag";
import type { Eu } from "../sessao/useEu";
import { mensagemDe } from "./followup/comum";
import estilos from "./Reunioes.module.css";

const TIPO = { diagnostica: "Diagnóstica", proposta: "Proposta" };

/** A reunião que ainda não encerrou, mas cuja oportunidade já andou (a etapa foi registrada por outro caminho). */
const jaPassou = (r: Reuniao) => r.situacao !== "concluida" && !oportunidadeNaEtapa(r);
const ROTULO_DESFECHO = Object.fromEntries(PLAYBOOK_PROPOSTA.resultados.map((x) => [x.id, x.rotulo])) as Record<string, string>;

/** O que mostrar: os próximos 7 dias e as reuniões passadas ainda sem resultado. */
function daAgenda(r: Reuniao, hoje: string): boolean {
  if (r.situacao === "cancelada") return false;
  if (r.dataHora.slice(0, 10) >= hoje) return true;
  // Passada e sem fechamento (diagnóstica ou proposta): continua aqui até alguém encerrar.
  return r.situacao !== "concluida" && !jaPassou(r);
}

function AcaoDaReuniao({ r }: { r: Reuniao }) {
  const navegar = useNavigate();
  if (r.situacao === "concluida") {
    if (r.tipo === "diagnostica") return <Link to={`/reunioes/${r.id}/briefing`}>Briefing</Link>;
    return <span className="suave">{r.desfecho ? `Concluída · ${ROTULO_DESFECHO[r.desfecho]}` : "Concluída"}</span>;
  }
  if (jaPassou(r)) return <span className="suave">A oportunidade já passou {r.tipo === "diagnostica" ? "da diagnóstica" : "da proposta"}</span>;
  return <Botao onClick={() => navegar(`/reunioes/${r.id}/${r.tipo}`)}>{r.situacao === "em_andamento" ? "Continuar" : "Iniciar"}</Botao>;
}

/** Reuniões: a agenda por dia, com Iniciar (diagnóstica) e o briefing das concluídas. */
export default function Reunioes({ eu }: { eu: Eu }) {
  const [reunioes, setReunioes] = useState<Reuniao[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const hoje = hojeEmSaoPaulo();
    api<Reuniao[]>(`/api/reunioes?de=${diasDepois(hoje, -30)}&ate=${diasDepois(hoje, 6)}`)
      .then(setReunioes)
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);

  const hoje = hojeEmSaoPaulo();
  const agenda = (reunioes ?? []).filter((r) => daAgenda(r, hoje));
  const dias = [...new Set(agenda.map((r) => r.dataHora.slice(0, 10)))].sort();

  return (
    <div className={estilos.reunioes}>
      <header>
        <h1>Reuniões</h1>
        <p className="suave">Os próximos 7 dias e as diagnósticas que ainda não têm resultado.</p>
      </header>
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      {reunioes && agenda.length === 0 && <p className="suave">Nenhuma reunião na agenda.</p>}
      {dias.map((dia) => (
        <section key={dia} aria-label={formatarDia(dia)} className={estilos.dia}>
          <h2 className="mono">
            {formatarDia(dia)}
            {dia === hoje && <Tag tipo="hoje">Hoje</Tag>}
            {dia < hoje && <Tag tipo="atrasado">Sem resultado</Tag>}
          </h2>
          <ul>
            {agenda
              .filter((r) => r.dataHora.startsWith(dia))
              .map((r) => (
                <li key={r.id} className={estilos.reuniao}>
                  <span className="mono">{r.dataHora.slice(11, 16)}</span>
                  <span className={estilos.quem}>
                    <strong>{r.empresa}</strong>
                    <span className="suave">
                      {TIPO[r.tipo]} · {r.formato === "online" ? "online" : "presencial"}
                      {eu.cargo === "diretor" && r.closerNome ? ` · ${r.closerNome}` : ""}
                    </span>
                  </span>
                  <AcaoDaReuniao r={r} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
