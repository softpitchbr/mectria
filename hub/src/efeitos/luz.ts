import { useEffect, type RefObject } from "react";

/** A luz não acompanha dedo (celular) nem roda com movimento reduzido. */
function luzDesligada(): boolean {
  if (typeof window.matchMedia !== "function") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function seguirPonteiro(alvo: EventTarget, gravar: (e: PointerEvent) => void): () => void {
  let quadro = 0;
  let ultimo: PointerEvent | null = null;
  const aoMover = (e: Event) => {
    ultimo = e as PointerEvent;
    if (quadro) return;
    quadro = requestAnimationFrame(() => {
      quadro = 0;
      if (ultimo) gravar(ultimo);
    });
  };
  alvo.addEventListener("pointermove", aoMover, { passive: true });
  return () => {
    alvo.removeEventListener("pointermove", aoMover);
    if (quadro) cancelAnimationFrame(quadro);
  };
}

/** Grava --cx e --cy (px) no <html> para a grade acender perto do cursor. */
export function useLuzDoCursor(): void {
  useEffect(() => {
    if (luzDesligada()) return;
    const raiz = document.documentElement;
    return seguirPonteiro(window, (e) => {
      raiz.style.setProperty("--cx", `${e.clientX}px`);
      raiz.style.setProperty("--cy", `${e.clientY}px`);
    });
  }, []);
}

/** Grava --x e --y (px) relativos ao elemento, para o brilho do cartão. */
export function usePosicaoNoElemento(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || luzDesligada()) return;
    return seguirPonteiro(el, (e) => {
      const caixa = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - caixa.left}px`);
      el.style.setProperty("--y", `${e.clientY - caixa.top}px`);
    });
  }, [ref]);
}
