import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { PLAYBOOK_PROPOSTA } from "../../compartilhado/dados/playbooks";
import type { Reuniao } from "../../compartilhado/oportunidade";
import {
  faltandoNaProposta,
  quemDecideNaSala,
  type DesfechoProposta,
  montarSlides,
  partesDoModelo,
  slidesDaProposta,
  valoresDaProposta,
  type SessaoProposta,
} from "../../compartilhado/proposta";
import { api } from "../api/cliente";
import Slide from "../apresentacao/Slide";
import { avisar } from "../componentes/Aviso";
import Botao from "../componentes/Botao";
import Anotacoes from "../diagnostica/Anotacoes";
import { useRascunho, type EstadoRascunho } from "../diagnostica/rascunho";
import { mensagemDe } from "../telas/followup/comum";
import { useAndamento } from "./andamento";
import { abrirCanal } from "./canal";
import { useDonoDaReuniao } from "./dono";
import FechamentoDaProposta from "./FechamentoDaProposta";
import ObjecoesDaReuniao from "./ObjecoesDaReuniao";
import Sala from "./Sala";
import { alternarPacto, avancar, irPara, precisaDeQuemDecide, somarTempo, voltar } from "./sessao";
import estilos from "./Painel.module.css";

const ROTULO_ESTADO: Record<EstadoRascunho, string> = {
  salvo: "Salvo",
  salvando: "Salvando…",
  sem_internet: "Sem internet · salvo neste computador",
  sem_permissao: "Não salvo no servidor · salvo neste computador",
};
const GRAVIDADE: EstadoRascunho[] = ["salvo", "salvando", "sem_internet", "sem_permissao"];
const pior = (a: EstadoRascunho, b: EstadoRascunho) => (GRAVIDADE.indexOf(a) >= GRAVIDADE.indexOf(b) ? a : b);

const TEXTO_DO_PACTO = Object.fromEntries(PLAYBOOK_PROPOSTA.pactos.map((p) => [p.id, p.texto])) as Record<string, string>;
const TOTAL_DE_PACTOS = PLAYBOOK_PROPOSTA.pactos.length;
/** Sem sinal da janela por mais que isso, o painel oferece reabrir. */
const JANELA_SUMIU_MS = 5000;

/** Campo onde as teclas são do texto (o checkbox de "decide" não conta: depois dele, as setas continuam passando o slide). */
const emCampo = (alvo: EventTarget | null) =>
  !!(alvo as HTMLElement | null)?.closest?.('textarea, select, [contenteditable], input:not([type="checkbox"])');
const relogio = (segundos: number) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

/** Abre (ou traz de volta) a janela da apresentação, com uns 70% da tela, à esquerda. */
function abrirJanela(reuniaoId: number) {
  const largura = Math.round((window.screen?.availWidth || 1600) * 0.7);
  const altura = window.screen?.availHeight || 900;
  window.open(`/apresentacao/${reuniaoId}`, `hub-apresentacao-${reuniaoId}`, `popup,left=0,top=0,width=${largura},height=${altura}`);
}

/** Painel da reunião de proposta: antes de começar (sala e janela) e ao vivo (slides, fala, pactos, tempo e anotações). */
export default function PainelDaProposta() {
  const { id } = useParams();
  const reuniaoId = Number(id);
  const navegar = useNavigate();
  const [sessao, setSessao] = useState<SessaoProposta | null>(null);
  const [erro, setErro] = useState("");
  const [anotando, setAnotando] = useState(false);
  const [objecoes, setObjecoes] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const [ultimaViva, setUltimaViva] = useState(0);
  const slides = useMemo(() => slidesDaProposta(), []);

  useEffect(() => {
    api<SessaoProposta>(`/api/reunioes/${reuniaoId}/proposta`)
      .then(setSessao)
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, [reuniaoId]);

  const { valores, doCliente } = useMemo(
    () =>
      sessao
        ? valoresDaProposta({
            oportunidade: sessao.oportunidade,
            variaveis: sessao.variaveis,
            respostas: sessao.respostasDaDiagnostica,
            hoje: hojeEmSaoPaulo(),
            servico: sessao.servico,
          })
        : {
            valores: {} as Record<string, string>,
            doCliente: new Set<string>(),
          },
    [sessao],
  );
  const montados = useMemo(() => montarSlides(slides, valores, doCliente), [slides, valores, doCliente]);
  const dono = useDonoDaReuniao(reuniaoId);
  const andamento = useAndamento(reuniaoId, sessao?.andamento ?? null, 5000, dono === "sim");
  const inicialDasNotas = useMemo(() => (sessao ? { respostas: {}, anotacoes: sessao.anotacoes } : null), [sessao]);
  const rascunho = useRascunho(reuniaoId, inicialDasNotas);
  const a = andamento.andamento;
  const aoVivo = sessao?.reuniao.situacao === "em_andamento";

  // O canal entre as janelas lê sempre o estado mais recente.
  const atual = useRef({ a, montados, empresa: "", aoVivo, fechando, dono, mudar: andamento.mudar });
  atual.current = { a, montados, empresa: sessao?.oportunidade.empresa ?? "", aoVivo, fechando, dono, mudar: andamento.mudar };
  const canal = useRef<ReturnType<typeof abrirCanal> | null>(null);

  useEffect(() => {
    const enviarEstado = () => {
      const r = atual.current;
      if (r.a && r.empresa)
        canal.current?.enviar({
          tipo: "estado",
          empresa: r.empresa,
          slide: r.a.slide,
          apresentacao: { tipo: "exemplo", slides: r.montados },
        });
    };
    canal.current = abrirCanal(reuniaoId, (m) => {
      // Só o painel dono da reunião conversa com a janela.
      if (atual.current.dono !== "sim") return;
      if (m.tipo === "pronta" || m.tipo === "viva") setUltimaViva(Date.now());
      if (m.tipo === "pronta") enviarEstado();
      else if (m.tipo === "tecla" && atual.current.aoVivo && !atual.current.fechando) {
        atual.current.mudar((x) => (m.tecla === "ArrowRight" ? avancar(x, slides.length) : voltar(x)));
      }
    });
    return () => {
      canal.current?.fechar();
      canal.current = null;
    };
  }, [reuniaoId, slides.length]);

  // Uma janela já aberta recebe o estado inteiro quando o painel fica pronto; depois, só o slide.
  const pronto = !!a && !!sessao && dono === "sim";
  useEffect(() => {
    const r = atual.current;
    if (pronto && r.a)
      canal.current?.enviar({
        tipo: "estado",
        empresa: r.empresa,
        slide: r.a.slide,
        apresentacao: { tipo: "exemplo", slides: montados },
      });
  }, [pronto, montados]);
  const slideAtual = a?.slide;
  useEffect(() => {
    if (slideAtual !== undefined && atual.current.dono === "sim") canal.current?.enviar({ tipo: "slide", slide: slideAtual });
  }, [slideAtual]);

  // Um relógio de 1 s: o tempo total, o sinal da janela e, ao vivo, o tempo do bloco.
  useEffect(() => {
    const t = setInterval(() => {
      setAgora(Date.now());
      // O tempo do bloco só corre com os slides na tela (o fechamento aberto para o relógio) e não mexe no "Salvo".
      if (atual.current.dono === "sim" && atual.current.aoVivo && !atual.current.fechando) atual.current.mudar((x) => somarTempo(x, slides[x.slide].id, 1), { silencioso: true });
    }, 1000);
    return () => clearInterval(t);
  }, [slides]);

  useEffect(() => {
    if (!aoVivo || dono !== "sim") return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (emCampo(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      const mudar = atual.current.mudar;
      if (e.key === "ArrowRight" && !atual.current.fechando) mudar((x) => avancar(x, slides.length));
      else if (e.key === "ArrowLeft" && !atual.current.fechando) mudar(voltar);
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setAnotando(true);
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setObjecoes(true);
      } else if (e.key === "Escape") {
        setObjecoes(false);
        setAnotando(false);
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoVivo, dono, slides.length]);

  function aoEncerrar(desfecho: DesfechoProposta) {
    canal.current?.enviar({ tipo: "fim" });
    if (desfecho === "ganho") avisar("Proposta registrada como ganha.");
    else if (desfecho === "perdido") avisar("Proposta registrada como perdida.");
    else avisar("Proposta no follow-up, com os toques criados.");
    navegar(desfecho === "ganho" || desfecho === "perdido" ? "/reunioes" : "/follow-up", { replace: true });
  }

  async function comecar() {
    try {
      const reuniao = await api<Reuniao>(`/api/reunioes/${reuniaoId}/iniciar`, {
        method: "POST",
      });
      setSessao((s) => (s ? { ...s, reuniao } : s));
    } catch (e) {
      avisar(mensagemDe(e));
    }
  }

  if (erro) {
    return (
      <main className={estilos.painel} aria-label="Painel da proposta">
        <div className={estilos.mensagem}>
          <p role="alert">{erro}</p>
          <Link to="/reunioes">← Reuniões</Link>
        </div>
      </main>
    );
  }
  if (dono === "outra_aba") {
    return (
      <main className={estilos.painel} aria-label="Painel da proposta">
        <div className={estilos.mensagem}>
          <p>Esta reunião já está aberta em outra aba. Continue por lá.</p>
          <Link to="/reunioes">← Reuniões</Link>
        </div>
      </main>
    );
  }
  if (!sessao || !a || dono !== "sim") return <p className={`mono suave ${estilos.carregando}`}>Abrindo o painel…</p>;

  const { reuniao, oportunidade } = sessao;
  if (reuniao.situacao === "concluida" || reuniao.situacao === "cancelada") {
    return (
      <main className={estilos.painel} aria-label="Painel da proposta">
        <div className={estilos.mensagem}>
          <p>Essa reunião já foi encerrada.</p>
          <Link to="/reunioes">← Reuniões</Link>
        </div>
      </main>
    );
  }

  const estado = pior(andamento.estado, rascunho.estado);
  const aviso = andamento.aviso || rascunho.aviso;
  const janelaViva = agora - ultimaViva < JANELA_SUMIU_MS;
  const mudarSala = (sala: typeof a.sala) => andamento.mudar((x) => ({ ...x, sala }));
  const botaoDaJanela = janelaViva ? (
    <span className="mono suave" role="status">
      Apresentação aberta
    </span>
  ) : (
    <Botao onClick={() => abrirJanela(reuniaoId)}>{ultimaViva > 0 ? "Reabrir apresentação" : "Abrir apresentação"}</Botao>
  );
  const topo = (
    <header className={estilos.topo}>
      <div>
        <p className={`mono ${estilos.sobre}`}>
          {aoVivo ? <span className={estilos.seloAoVivo}>AO VIVO</span> : "PROPOSTA"} · {oportunidade.contato}
        </p>
        <h1 className={estilos.empresa}>{oportunidade.empresa}</h1>
      </div>
      <span className={estado === "sem_internet" || estado === "sem_permissao" ? estilos.semInternet : "mono suave"} role="status">
        {ROTULO_ESTADO[estado]}
      </span>
      <button type="button" className={estilos.sair} onClick={() => navegar("/reunioes")}>
        Sair do painel
      </button>
    </header>
  );

  if (!aoVivo) {
    const falta = faltandoNaProposta(sessao.variaveis);
    return (
      <main className={estilos.painel} aria-label="Painel da proposta">
        {topo}
        <div className={estilos.antes}>
          <h2 className={estilos.subtitulo}>Antes de começar</h2>
          {falta.length > 0 && (
            <p className={estilos.falta}>
              Falta preparar: {falta.join(", ")}. <Link to="/apresentacoes">Preparar em Apresentações</Link>
            </p>
          )}
          <Sala sala={a.sala} aoMudar={mudarSala} />
          <section className={estilos.janela} aria-label="Janela da apresentação">
            {botaoDaJanela}
            <p className={estilos.lembrete}>No Meet ou no Zoom, compartilhe só a janela “Apresentação · {oportunidade.empresa}”.</p>
            <p className="suave">Deixe a apresentação à esquerda e este painel à direita. Os slides passam por aqui, pelas setas.</p>
          </section>
          <Botao variante="primario" onClick={comecar}>
            Começar reunião
          </Botao>
        </div>
      </main>
    );
  }

  const slide = slides[a.slide];
  const proximo = montados[a.slide + 1];
  const tempoReal = a.tempos[slide.id] ?? 0;
  const estourou = tempoReal > slide.tempoPlanejado;
  const inicio = reuniao.iniciadaEm ? Date.parse(`${reuniao.iniciadaEm.replace(" ", "T")}Z`) : agora;
  const minuto = Math.max(0, Math.floor((agora - inicio) / 60_000));
  const pactoFeito = !!slide.pacto && a.pactos.some((p) => p.id === slide.pacto);

  return (
    <main className={estilos.painel} aria-label="Painel da proposta">
      {topo}
      {aviso && (
        <p role="alert" className={estilos.avisoRascunho}>
          {aviso}
        </p>
      )}
      <div className={estilos.aoVivo}>
        {fechando ? (
          <div className={estilos.coluna}>
            <FechamentoDaProposta
              reuniaoId={reuniaoId}
              valorInicial={sessao.variaveis.valor}
              quemDecideInicial={quemDecideNaSala(a.sala) || reuniao.quemDecide || ""}
              antesDeEncerrar={async () => (await andamento.sincronizar()) && (await rascunho.sincronizar())}
              aoEncerrar={aoEncerrar}
              aoVoltar={() => setFechando(false)}
            />
          </div>
        ) : (
          <div className={estilos.coluna}>
            <div className={estilos.linhaDoSlide}>
              <span className="mono">
                {a.slide + 1} de {slides.length}
              </span>
              <span className="mono suave">{relogio(Math.max(0, Math.floor((agora - inicio) / 1000)))} no total</span>
              <span className={estilos.tempo} aria-label="Tempo do bloco" data-estourou={estourou ? "sim" : undefined}>
                {relogio(tempoReal)} / {relogio(slide.tempoPlanejado)}
              </span>
            </div>
            <nav className={estilos.segmentos} aria-label="Slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Ir para o slide ${i + 1}`}
                  aria-current={i === a.slide ? "step" : undefined}
                  data-passou={i < a.slide ? "sim" : undefined}
                  className={estilos.segmento}
                  onClick={() => andamento.mudar((x) => irPara(x, i, slides.length))}
                />
              ))}
            </nav>

            {precisaDeQuemDecide(a, slides) && (
              <p role="alert" className={estilos.alerta}>
                Quem decide não está na sala. Segure o preço e marque a conversa com quem decide.
              </p>
            )}

            <h2 className={estilos.tituloDoSlide}>{montados[a.slide].titulo.map((p) => p.texto).join("")}</h2>
            {slide.fala && (
              <section className={estilos.fala} aria-label="Fala">
                <p>
                  {partesDoModelo(slide.fala, valores, doCliente).map((p, i) =>
                    p.tipo === "cliente" ? (
                      <mark key={i}>{p.texto}</mark>
                    ) : p.tipo === "falta" ? (
                      <span key={i} className={estilos.pendencia}>
                        {p.texto}
                      </span>
                    ) : (
                      <span key={i}>{p.texto}</span>
                    ),
                  )}
                </p>
                {slide.dica && <p className={`suave ${estilos.dica}`}>{slide.dica}</p>}
              </section>
            )}

            <div className={estilos.pactos}>
              {slide.pacto && (
                <Botao
                  variante={pactoFeito ? "secundario" : "primario"}
                  className={estilos.pacto}
                  aria-pressed={pactoFeito}
                  data-feito={pactoFeito ? "sim" : undefined}
                  onClick={() => andamento.mudar((x) => alternarPacto(x, slide.pacto!, minuto))}
                >
                  {pactoFeito ? "✓ " : ""}Pacto: {TEXTO_DO_PACTO[slide.pacto]}
                </Botao>
              )}
              <span className="mono suave">
                {a.pactos.length} de {TOTAL_DE_PACTOS} pactos
              </span>
            </div>

            <div className={estilos.navegacao}>
              <Botao variante="fantasma" disabled={a.slide === 0} onClick={() => andamento.mudar(voltar)}>
                ← Voltar
              </Botao>
              {proximo ? (
                <Botao variante={slide.pacto && !pactoFeito ? "secundario" : "primario"} onClick={() => andamento.mudar((x) => avancar(x, slides.length))}>
                  Próximo →
                </Botao>
              ) : (
                <Botao variante={slide.pacto && !pactoFeito ? "secundario" : "primario"} onClick={() => setFechando(true)}>
                  Ir para o fechamento
                </Botao>
              )}
              {botaoDaJanela}
            </div>
            {proximo && (
              <div className={estilos.miniatura} aria-label="Próximo slide">
                <p className={`mono ${estilos.sobre}`}>A SEGUIR</p>
                <Slide slide={proximo} destacarFaltas />
              </div>
            )}
          </div>
        )}

        <div className={estilos.lateral}>
          <Sala sala={a.sala} aoMudar={mudarSala} />
          {objecoes && <ObjecoesDaReuniao aoFechar={() => setObjecoes(false)} />}
          {!objecoes && (
            <button type="button" className={estilos.botaoObjecoes} onClick={() => setObjecoes(true)}>
              <kbd>O</kbd> Objeções
            </button>
          )}
          <Anotacoes
            anotacoes={rascunho.anotacoes}
            aberto={anotando}
            aoAbrir={() => setAnotando(true)}
            aoFechar={() => setAnotando(false)}
            aoSalvar={(texto, marcacao) =>
              rascunho.anotar({
                idCliente: crypto.randomUUID(),
                minuto,
                passo: slide.id,
                marcacao,
                texto,
              })
            }
            descreverPasso={(passo) => `Slide ${slides.findIndex((s) => s.id === passo) + 1}`}
          />
        </div>
      </div>
    </main>
  );
}
