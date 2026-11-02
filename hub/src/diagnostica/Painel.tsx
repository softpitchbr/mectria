import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { roteiroDaDiagnostica, type Marcacao, type Passo } from "../../compartilhado/diagnostica";
import type { FichaCompleta } from "../../compartilhado/oportunidade";
import { api } from "../api/cliente";
import { avisar } from "../componentes/Aviso";
import { mensagemDe } from "../telas/followup/comum";
import Anotacoes from "./Anotacoes";
import Fechamento from "./Fechamento";
import Pergunta from "./Pergunta";
import { useRascunho } from "./rascunho";
import estilos from "./Painel.module.css";

const ROTULO_ESTADO = { salvo: "Salvo", salvando: "Salvando…", sem_internet: "Sem internet · salvo neste computador" };

/** Os grupos da barra de segmentos, na ordem do roteiro. */
function grupoDo(p: Passo): string {
  if (p.grupo === "bloco") return p.letra!;
  return { abertura: "Abertura", tecnica: "Técnico", escopo: "Escopo", fechamento: "Fechamento" }[p.grupo as "abertura"];
}

const emCampo = (alvo: EventTarget | null) => !!(alvo as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");

/** Painel da diagnóstica em tela cheia: uma pergunta por vez, anotações e fechamento obrigatório. */
export default function PainelDaDiagnostica() {
  const { id } = useParams();
  const reuniaoId = Number(id);
  const navegar = useNavigate();
  const [ficha, setFicha] = useState<FichaCompleta | null>(null);
  const [erro, setErro] = useState("");
  const [indice, setIndice] = useState<number | null>(null);
  const [anotando, setAnotando] = useState(false);
  const inicio = useRef(Date.now());
  const [agora, setAgora] = useState(Date.now());

  const inicial = useMemo(() => (ficha ? { respostas: ficha.respostas, anotacoes: ficha.anotacoes } : null), [ficha]);
  const rascunho = useRascunho(reuniaoId, inicial);

  useEffect(() => {
    api<FichaCompleta>(`/api/reunioes/${reuniaoId}`)
      .then(async (f) => {
        if (f.reuniao.situacao === "marcada") f = { ...f, reuniao: await api(`/api/reunioes/${reuniaoId}/iniciar`, { method: "POST" }) };
        if (f.reuniao.iniciadaEm) inicio.current = Date.parse(`${f.reuniao.iniciadaEm.replace(" ", "T")}Z`);
        setFicha(f);
      })
      .catch((e: unknown) => setErro(mensagemDe(e)));
    const relogio = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(relogio);
  }, [reuniaoId]);

  const roteiro = useMemo(() => (ficha ? roteiroDaDiagnostica(ficha.oportunidade.servico) : []), [ficha]);
  const grupos = useMemo(() => [...new Set(roteiro.map(grupoDo))], [roteiro]);

  // Volta no mesmo ponto: a primeira pergunta ainda sem resposta (ou a abertura, se nada foi respondido).
  useEffect(() => {
    if (!ficha || indice !== null) return;
    const algumaResposta = Object.values(ficha.respostas).some((r) => r.trim());
    const primeira = roteiro.findIndex((p) => p.pergunta && !ficha.respostas[p.pergunta.id]?.trim());
    setIndice(algumaResposta && primeira >= 0 ? primeira : 0);
  }, [ficha, roteiro, indice]);

  const atual = indice !== null ? roteiro[indice] : undefined;
  const minuto = Math.max(0, Math.floor((agora - inicio.current) / 60_000));

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (emCampo(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if (e.key === "ArrowRight") setIndice((i) => (i === null ? i : Math.min(roteiro.length - 1, i + 1)));
      else if (e.key === "ArrowLeft") setIndice((i) => (i === null ? i : Math.max(0, i - 1)));
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setAnotando(true);
      } else if (e.key === "Escape") setAnotando(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [roteiro.length]);

  function anotar(texto: string, marcacao: Marcacao | null) {
    rascunho.anotar({ idCliente: crypto.randomUUID(), minuto, passo: atual?.id ?? "", marcacao, texto });
  }

  if (erro) {
    return (
      <main className={estilos.painel} aria-label="Painel da diagnóstica">
        <p role="alert">{erro}</p>
      </main>
    );
  }
  if (!ficha || !atual || indice === null) return <p className={`mono suave ${estilos.carregando}`}>Abrindo o painel…</p>;

  const respondido = (g: string) => roteiro.filter((p) => grupoDo(p) === g && p.pergunta).every((p) => rascunho.respostas[p.pergunta!.id]?.trim());

  return (
    <main className={estilos.painel} aria-label="Painel da diagnóstica">
      <header className={estilos.topo}>
        <div>
          <p className={`mono ${estilos.sobre}`}>DIAGNÓSTICA · {ficha.oportunidade.contato}</p>
          <h1 className={estilos.empresa}>{ficha.oportunidade.empresa}</h1>
        </div>
        <span className="mono">{minuto} min</span>
        <span className={rascunho.estado === "sem_internet" ? estilos.semInternet : "mono suave"} role="status">
          {ROTULO_ESTADO[rascunho.estado]}
        </span>
        <button type="button" className={estilos.sair} onClick={() => navegar("/reunioes")}>
          Sair do painel
        </button>
      </header>

      <nav className={estilos.segmentos} aria-label="Partes da diagnóstica">
        {grupos.map((g) => (
          <button
            key={g}
            type="button"
            aria-label={`Ir para ${g}`}
            aria-current={grupoDo(atual) === g ? "step" : undefined}
            className={estilos.segmento}
            data-cheio={respondido(g) && roteiro.some((p) => grupoDo(p) === g && p.pergunta) ? "sim" : undefined}
            onClick={() => setIndice(roteiro.findIndex((p) => grupoDo(p) === g))}
          >
            {g}
          </button>
        ))}
      </nav>

      <div className={estilos.corpo}>
        <section className={estilos.passo}>
          <p className={`mono ${estilos.sobre}`}>
            {atual.letra ? `${atual.letra} · ` : ""}
            {indice + 1} de {roteiro.length}
          </p>
          <h2>{atual.titulo}</h2>
          {atual.grupo === "fechamento" ? (
            <Fechamento
              reuniaoId={reuniaoId}
              contato={ficha.oportunidade.contato}
              respostas={rascunho.respostas}
              antesDeEncerrar={rascunho.sincronizar}
              aoEncerrar={() => {
                avisar("Diagnóstica encerrada.");
                navegar(`/reunioes/${reuniaoId}/briefing`);
              }}
            />
          ) : atual.pergunta ? (
            <>
              <p className={estilos.pergunta}>{atual.pergunta.texto}</p>
              <Pergunta
                key={atual.pergunta.id}
                pergunta={atual.pergunta}
                valor={rascunho.respostas[atual.pergunta.id] ?? ""}
                aoMudar={(v) => rascunho.responder(atual.pergunta!.id, v)}
              />
            </>
          ) : (
            <p className={estilos.fala}>{atual.fala}</p>
          )}
          {atual.dica && atual.grupo !== "fechamento" && <p className={`suave ${estilos.dica}`}>{atual.dica}</p>}
          {atual.grupo !== "fechamento" && (
            <div className={estilos.navegacao}>
              <button type="button" className={estilos.navegar} disabled={indice === 0} onClick={() => setIndice(indice - 1)}>
                ← Anterior
              </button>
              <button type="button" className={estilos.navegar} onClick={() => setIndice(Math.min(roteiro.length - 1, indice + 1))}>
                Próxima →
              </button>
            </div>
          )}
        </section>

        <Anotacoes anotacoes={rascunho.anotacoes} aberto={anotando} aoAbrir={() => setAnotando(true)} aoFechar={() => setAnotando(false)} aoSalvar={anotar} />
      </div>
    </main>
  );
}
