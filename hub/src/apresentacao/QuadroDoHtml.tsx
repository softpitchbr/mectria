import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { lerMensagemDaApresentacao, type DaApresentacao, type Interacoes, type ParaApresentacao } from "../../compartilhado/contrato-apresentacao";
import estilos from "./QuadroDoHtml.module.css";

export interface ControleDoQuadro {
  acionar(acao: string): void;
  calcular(valores: Record<string, number>): void;
}

type SemVersao<T> = T extends unknown ? Omit<T, "mectria"> : never;

/**
 * A apresentação em HTML de um serviço, num iframe isolado: sandbox sem allow-same-origin
 * (outra origem, sem o login), sem permissões e sem referrer. Só as mensagens que vêm desse
 * iframe e seguem o contrato chegam a aoReceber.
 */
export default function QuadroDoHtml({
  url,
  titulo,
  slide,
  dados,
  interacoes,
  aoReceber,
  ref,
}: {
  url: string;
  titulo: string;
  slide: number;
  dados: Record<string, string>;
  interacoes: Interacoes;
  aoReceber: (m: DaApresentacao) => void;
  ref?: Ref<ControleDoQuadro>;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const atual = useRef({ slide, dados, interacoes, aoReceber });
  atual.current = { slide, dados, interacoes, aoReceber };

  const enviar = useCallback((m: SemVersao<ParaApresentacao>) => {
    iframe.current?.contentWindow?.postMessage({ mectria: 1, ...m }, "*");
  }, []);
  const enviarEstado = useCallback(() => {
    const a = atual.current;
    enviar({ tipo: "estado", slide: a.slide, dados: a.dados, interacoes: a.interacoes });
  }, [enviar]);

  useImperativeHandle(ref, () => ({ acionar: (acao) => enviar({ tipo: "acionar", acao }), calcular: (valores) => enviar({ tipo: "calcular", valores }) }), [enviar]);

  useEffect(() => {
    const aoMensagem = (e: MessageEvent) => {
      if (!iframe.current || e.source !== iframe.current.contentWindow) return;
      const m = lerMensagemDaApresentacao(e.data);
      if (!m) return;
      if (m.tipo === "pronta") enviarEstado();
      atual.current.aoReceber(m);
    };
    window.addEventListener("message", aoMensagem);
    return () => window.removeEventListener("message", aoMensagem);
  }, [enviarEstado]);

  // Dados novos do painel (a janela recebeu outro estado): a apresentação recebe o estado inteiro de novo.
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    enviarEstado();
  }, [dados, enviarEstado]);

  const anterior = useRef(slide);
  useEffect(() => {
    if (anterior.current === slide) return;
    anterior.current = slide;
    enviar({ tipo: "slide", slide });
  }, [slide, enviar]);

  return <iframe key={url} ref={iframe} className={estilos.quadro} src={url} title={titulo} sandbox="allow-scripts" allow="" referrerPolicy="no-referrer" />;
}
