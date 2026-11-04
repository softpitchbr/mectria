import { useMemo, useState, type JSX } from "react";
import { NavLink, useParams, useSearchParams } from "react-router";
import { ROTULO_TOQUE } from "../../compartilhado/cadencia";
import { CADENCIA, REGRAS_FOLLOWUP } from "../../compartilhado/dados/cadencia";
import { ANTES_COLD_CALL, GATEKEEPER, ROTEIRO_COLD_CALL, TENTATIVAS_COLD_CALL } from "../../compartilhado/dados/cold-call";
import { DIAGNOSTICA } from "../../compartilhado/dados/diagnostica";
import { ETAPAS_OBJECAO, OBJECOES } from "../../compartilhado/dados/objecoes";
import { PLAYBOOK_PROPOSTA } from "../../compartilhado/dados/playbooks";
import { normalizar } from "../../compartilhado/texto";
import { avisar } from "../componentes/Aviso";
import Painel from "../componentes/Painel";
import type { Eu } from "../sessao/useEu";
import estilos from "./Playbooks.module.css";

type Aba = "cold-call" | "diagnostica" | "proposta" | "objecoes" | "follow-up";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "cold-call", rotulo: "Cold call" },
  { id: "diagnostica", rotulo: "Diagnóstica" },
  { id: "proposta", rotulo: "Proposta" },
  { id: "objecoes", rotulo: "Objeções" },
  { id: "follow-up", rotulo: "Follow-up" },
];

/** O hunter consulta o cold call e as objeções; closer e diretor, tudo. */
const abasDo = (eu: Eu) => (eu.cargo === "hunter" ? ABAS.filter((a) => a.id === "cold-call" || a.id === "objecoes") : ABAS);

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    avisar("Copiado.");
  } catch {
    avisar("Não deu para copiar. Selecione o texto e copie.");
  }
}

function ColdCall() {
  return (
    <div className={estilos.conteudo}>
      <Painel>
        <h2>Antes de ligar</h2>
        <ul className={estilos.lista}>{ANTES_COLD_CALL.map((t) => <li key={t}>{t}</li>)}</ul>
      </Painel>
      <section className={estilos.secao}>
        <h2>Roteiro da ligação</h2>
        <ol className={estilos.passos}>
          {ROTEIRO_COLD_CALL.map((p) => (
            <li key={p.titulo}>
              <h3>{p.titulo}</h3>
              <p className={estilos.fala}>{p.fala}</p>
              {p.dica && <p className="suave">{p.dica}</p>}
            </li>
          ))}
        </ol>
      </section>
      <Painel>
        <h2>Recepção (gatekeeper)</h2>
        <ul className={estilos.lista}>{GATEKEEPER.map((t) => <li key={t}>{t}</li>)}</ul>
      </Painel>
      <Painel>
        <h2>Quando o decisor não atende</h2>
        <ul className={estilos.lista}>
          {TENTATIVAS_COLD_CALL.map((t, i) => (
            <li key={i}>
              <span className="mono">D{t.dia} · {t.canal}</span> {t.texto}
            </li>
          ))}
        </ul>
      </Painel>
    </div>
  );
}

function Diagnostica() {
  return (
    <div className={estilos.conteudo}>
      <Painel>
        <h2>Antes da reunião ({DIAGNOSTICA.duracao})</h2>
        <ul className={estilos.lista}>{DIAGNOSTICA.preparacao.map((t) => <li key={t}>{t}</li>)}</ul>
      </Painel>
      {DIAGNOSTICA.blocos.map((b) => (
        <section key={b.id} className={estilos.secao}>
          <h2>
            {b.letra} · {b.titulo}
          </h2>
          <p className="suave">{b.intro}</p>
          <ul className={estilos.lista}>{b.perguntas.map((p) => <li key={p.id}>{p.texto}</li>)}</ul>
        </section>
      ))}
      <Painel>
        <h2>Fechamento</h2>
        <p className={estilos.fala}>{DIAGNOSTICA.fechamento.resumo}</p>
        <p className={estilos.fala}>{DIAGNOSTICA.fechamento.pacto}</p>
        <p className="suave">{DIAGNOSTICA.fechamento.pactoDica}</p>
      </Painel>
    </div>
  );
}

function Proposta() {
  return (
    <div className={estilos.conteudo}>
      <Painel>
        <h2>Antes da apresentação ({PLAYBOOK_PROPOSTA.duracao})</h2>
        <ul className={estilos.lista}>{PLAYBOOK_PROPOSTA.antes.map((t) => <li key={t}>{t}</li>)}</ul>
      </Painel>
      <section className={estilos.secao}>
        <h2>Passos</h2>
        <ol className={estilos.passos}>
          {PLAYBOOK_PROPOSTA.passos.map((p) => (
            <li key={p.id}>
              <h3>
                {p.titulo} <span className="mono suave">{p.tempo}</span>
              </h3>
              <p className="suave">{p.objetivo}</p>
              {"fala" in p && p.fala && <p className={estilos.fala}>{p.fala}</p>}
              {"pacto" in p && p.pacto && <p><strong>Pacto:</strong> {String(p.pacto)}</p>}
            </li>
          ))}
        </ol>
      </section>
      <Painel>
        <h2>Pactos</h2>
        <ul className={estilos.lista}>{PLAYBOOK_PROPOSTA.pactos.map((p) => <li key={p.id}>{p.texto}</li>)}</ul>
      </Painel>
      <Painel>
        <h2>Condições</h2>
        <ul className={estilos.lista}>{PLAYBOOK_PROPOSTA.regrasCondicao.map((t) => <li key={t}>{t}</li>)}</ul>
      </Painel>
    </div>
  );
}

function Objecoes() {
  const [busca] = useSearchParams();
  const [consulta, setConsulta] = useState("");
  const [etapa, setEtapa] = useState<string | null>(null);
  const destaque = busca.get("o");
  const lista = useMemo(() => {
    const termos = normalizar(consulta).split(" ").filter(Boolean);
    return OBJECOES.filter((o) => {
      if (etapa && !o.etapas.includes(etapa)) return false;
      const texto = normalizar(`${o.objecao} ${o.porTras} ${o.contorno}`);
      return termos.every((t) => texto.includes(t));
    });
  }, [consulta, etapa]);

  return (
    <div className={estilos.conteudo}>
      <div className={estilos.filtros}>
        <input
          type="search"
          aria-label="Buscar objeção"
          placeholder="Buscar objeção (ex.: caro, prazo, concorrente)"
          className={estilos.busca}
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
        />
        <div className={estilos.etapas} role="group" aria-label="Etapa">
          <button type="button" aria-pressed={etapa === null} onClick={() => setEtapa(null)}>
            Todas
          </button>
          {Object.entries(ETAPAS_OBJECAO).map(([id, rotulo]) => (
            <button key={id} type="button" aria-pressed={etapa === id} onClick={() => setEtapa(etapa === id ? null : id)}>
              {rotulo}
            </button>
          ))}
        </div>
      </div>
      {lista.length === 0 && <p className="suave">Nenhuma objeção com esse texto.</p>}
      <ul className={estilos.objecoes} aria-label="Objeções">
        {lista.map((o) => (
          <li key={o.id} id={`objecao-${o.id}`} className={o.id === destaque ? estilos.destaque : undefined}>
            <p className={estilos.frase}>“{o.objecao}”</p>
            <p className="suave">
              <strong>Por trás:</strong> {o.porTras}
            </p>
            <p className={estilos.fala}>{o.contorno}</p>
            <button type="button" className={estilos.copiar} onClick={() => copiar(o.contorno)}>
              Copiar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FollowUp() {
  return (
    <div className={estilos.conteudo}>
      <Painel>
        <h2>Regras</h2>
        <ul className={estilos.lista}>{REGRAS_FOLLOWUP.map((t) => <li key={t}>{t}</li>)}</ul>
      </Painel>
      <ol className={estilos.passos}>
        {CADENCIA.map((t) => (
          <li key={t.codigo}>
            <h3>
              <span className="mono">{ROTULO_TOQUE[t.codigo]}</span> · {t.canal}
            </h3>
            <p className="suave">{t.objetivo}</p>
            <p className={estilos.fala}>{t.modelo}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const CONTEUDO: Record<Aba, () => JSX.Element> = {
  "cold-call": ColdCall,
  diagnostica: Diagnostica,
  proposta: Proposta,
  objecoes: Objecoes,
  "follow-up": FollowUp,
};

/** Playbooks de consulta: cold call, diagnóstica, proposta, objeções e follow-up. */
export default function Playbooks({ eu }: { eu: Eu }) {
  const { aba } = useParams();
  const abas = abasDo(eu);
  const atual = abas.find((a) => a.id === aba) ?? abas[0];
  const Conteudo = CONTEUDO[atual.id];
  return (
    <div className={estilos.playbooks}>
      <header>
        <h1>Playbooks</h1>
        <p className="suave">Rascunho da versão 0.2, até a validação com a MecTRIA.</p>
      </header>
      <nav aria-label="Playbooks" className={estilos.abas}>
        {abas.map((a) => (
          <NavLink key={a.id} to={`/playbooks/${a.id}`} className={a.id === atual.id ? estilos.abaAtual : estilos.aba} aria-current={a.id === atual.id ? "page" : undefined}>
            {a.rotulo}
          </NavLink>
        ))}
      </nav>
      <Conteudo />
    </div>
  );
}
