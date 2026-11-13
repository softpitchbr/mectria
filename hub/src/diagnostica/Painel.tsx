import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { INTERACOES_VAZIAS } from "../../compartilhado/contrato-apresentacao";
import { dadosDaDiagnostica, roteiroDaDiagnostica, slideDoPasso, type Marcacao, type Passo } from "../../compartilhado/diagnostica";
import type { FichaCompleta } from "../../compartilhado/oportunidade";
import { urlDaApresentacaoGeral, type ApresentacaoGeral } from "../../compartilhado/servico";
import { api } from "../api/cliente";
import { avisar } from "../componentes/Aviso";
import { abrirCanal } from "../reuniao/canal";
import { abrirJanela, JANELA_SUMIU_MS } from "../reuniao/janela";
import { mensagemDe } from "../telas/followup/comum";
import Anotacoes from "./Anotacoes";
import Fechamento from "./Fechamento";
import Pergunta from "./Pergunta";
import { useRascunho } from "./rascunho";
import estilos from "./Painel.module.css";

const ROTULO_ESTADO = {
  salvo: "Salvo",
  salvando: "Salvando…",
  sem_internet: "Sem internet · salvo neste computador",
  sem_permissao: "Não salvo no servidor · salvo neste computador",
};

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
  // A apresentação da diagnóstica (igual para todos): sem ela, o painel funciona sem a janela do cliente.
  const [urlDaApresentacao, setUrlDaApresentacao] = useState<string | null>(null);
  const [ultimaViva, setUltimaViva] = useState(0);

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

  const roteiro = useMemo(() => (ficha ? roteiroDaDiagnostica(ficha.perguntasDoServico.filter((p) => !p.inativa)) : []), [ficha]);
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
    api<ApresentacaoGeral[]>("/api/apresentacoes")
      .then((lista) => {
        const diagnostica = lista.find((g) => g.id === "diagnostica");
        setUrlDaApresentacao(diagnostica ? urlDaApresentacaoGeral(diagnostica) : null);
      })
      .catch(() => setUrlDaApresentacao(null));
  }, []);

  // A janela do cliente segue o roteiro: cada passo leva o slide e a etapa da conversa (o canal lê o estado mais recente).
  const paraAJanela = useRef({ ficha, atual, url: urlDaApresentacao, total: roteiro.length });
  paraAJanela.current = { ficha, atual, url: urlDaApresentacao, total: roteiro.length };
  const canal = useRef<ReturnType<typeof abrirCanal> | null>(null);
  const enviarEstado = useCallback(() => {
    const { ficha: f, atual: passo, url } = paraAJanela.current;
    if (!f || !passo || !url) return;
    canal.current?.enviar({
      tipo: "estado",
      empresa: f.oportunidade.empresa,
      slide: slideDoPasso(passo),
      apresentacao: { tipo: "html", url, dados: dadosDaDiagnostica(f, passo), interacoes: INTERACOES_VAZIAS },
    });
  }, []);
  useEffect(() => {
    canal.current = abrirCanal(reuniaoId, (m) => {
      if (m.tipo === "pronta" || m.tipo === "viva") setUltimaViva(Date.now());
      if (m.tipo === "pronta") enviarEstado();
      // A seta apertada dentro da apresentação passa a pergunta, como no painel.
      else if (m.tipo === "tecla") {
        const total = paraAJanela.current.total;
        setIndice((i) => (i === null ? i : m.tecla === "ArrowRight" ? Math.min(total - 1, i + 1) : Math.max(0, i - 1)));
      }
    });
    return () => {
      canal.current?.fechar();
      canal.current = null;
    };
  }, [reuniaoId, enviarEstado]);
  useEffect(() => {
    enviarEstado();
  }, [indice, ficha, urlDaApresentacao, enviarEstado]);
  // Com a apresentação, o sinal da janela é conferido a cada segundo.
  useEffect(() => {
    if (!urlDaApresentacao) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [urlDaApresentacao]);

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
        <span className={rascunho.estado === "sem_internet" || rascunho.estado === "sem_permissao" ? estilos.semInternet : "mono suave"} role="status">
          {ROTULO_ESTADO[rascunho.estado]}
        </span>
        {urlDaApresentacao &&
          (agora - ultimaViva < JANELA_SUMIU_MS ? (
            <span className="mono suave" title={`No Meet ou no Zoom, compartilhe só a janela “Apresentação · ${ficha.oportunidade.empresa}”.`}>
              Apresentação aberta
            </span>
          ) : (
            <button
              type="button"
              className={estilos.sair}
              title={`No Meet ou no Zoom, compartilhe só a janela “Apresentação · ${ficha.oportunidade.empresa}”.`}
              onClick={() => abrirJanela(reuniaoId)}
            >
              {ultimaViva > 0 ? "Reabrir apresentação" : "Abrir apresentação"}
            </button>
          ))}
        <button type="button" className={estilos.sair} onClick={() => navegar("/reunioes")}>
          Sair do painel
        </button>
      </header>

      {ficha.reuniao.observacoes && (
        <p role="note" aria-label="Observações de quem marcou" className={estilos.observacoes}>
          <span className="suave">Observações de quem marcou:</span> {ficha.reuniao.observacoes}
        </p>
      )}

      {rascunho.aviso && (
        <p role="alert" className={estilos.avisoRascunho}>
          {rascunho.aviso}
        </p>
      )}

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
              antesDeEncerrar={() => rascunho.sincronizar()}
              aoEncerrar={(resultado) => {
                canal.current?.enviar({ tipo: "fim" });
                if (resultado === "nao_compareceu") {
                  // Não há briefing de no-show: o hunter reagenda pelo Hoje.
                  avisar("Reunião cancelada: o cliente não compareceu. Reagende no Hoje.");
                  navegar("/");
                  return;
                }
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
