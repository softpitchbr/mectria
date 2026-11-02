import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Icone from "./Icone";
import estilos from "./Foco.module.css";

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function movimentoReduzido(): boolean {
  return typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Modo foco: a ação cresce a partir do cartão de origem (FLIP, 420 ms), o resto recua desfocado.
 * Esc sai, o Tab fica preso dentro e, ao sair, o foco volta para a origem.
 */
export default function Foco({
  titulo,
  origem,
  aoSair,
  children,
}: {
  titulo: string;
  origem?: HTMLElement | null;
  aoSair: () => void;
  children: ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const aoSairAtual = useRef(aoSair);
  aoSairAtual.current = aoSair;

  // Cresce a partir do cartão de origem.
  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el || !origem || movimentoReduzido()) return;
    // Mede sem nenhuma transformação (em desenvolvimento o efeito roda duas vezes).
    el.style.transition = "none";
    el.style.transform = "none";
    const de = origem.getBoundingClientRect();
    const para = el.getBoundingClientRect();
    if (!para.width || !para.height) return;
    el.style.transformOrigin = "top left";
    el.style.transform = `translate(${de.left - para.left}px, ${de.top - para.top}px) scale(${de.width / para.width}, ${de.height / para.height})`;
    void el.offsetWidth;
    el.style.transition = "transform var(--lento) var(--curva)";
    el.style.transform = "none";
  }, [origem]);

  // Foco no primeiro elemento da ação; ao sair, volta para a origem.
  useEffect(() => {
    const antes = (origem ?? document.activeElement) as HTMLElement | null;
    const primeiro = conteudo.current?.querySelector<HTMLElement>(FOCAVEIS) ?? caixa.current?.querySelector<HTMLElement>(FOCAVEIS);
    primeiro?.focus();
    const aoTeclar = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      // Esc num campo só sai do campo (spec: "Esc sai do campo ou do foco"); o próximo Esc sai do foco.
      const ativo = document.activeElement as HTMLElement | null;
      if (ativo && caixa.current?.contains(ativo) && ativo.matches("input, textarea, select")) {
        ativo.blur();
        return;
      }
      aoSairAtual.current();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      antes?.focus?.();
    };
  }, [origem]);

  function prenderTab(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !caixa.current) return;
    const focaveis = [...caixa.current.querySelectorAll<HTMLElement>(FOCAVEIS)];
    if (focaveis.length === 0) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  return createPortal(
    <div className={estilos.veu}>
      <div ref={caixa} role="dialog" aria-modal="true" aria-label={titulo} className={estilos.caixa} onKeyDown={prenderTab}>
        <div className={estilos.topo}>
          <p className={`mono ${estilos.titulo}`}>{titulo}</p>
          <button type="button" className={estilos.sair} onClick={() => aoSairAtual.current()}>
            <Icone nome="fechar" tamanho={16} />
            Sair do foco
          </button>
        </div>
        <div ref={conteudo} className={estilos.conteudo}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
