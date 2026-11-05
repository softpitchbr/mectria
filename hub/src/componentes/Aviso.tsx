import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import estilos from "./Aviso.module.css";

const DURACAO = 2400;

let atual = "";
let cronometro: ReturnType<typeof setTimeout> | undefined;
const ouvintes = new Set<() => void>();

function publicar(texto: string) {
  atual = texto;
  ouvintes.forEach((o) => o());
}

/** Mostra um aviso curto no rodapé por 2,4 s. */
export function avisar(texto: string): void {
  clearTimeout(cronometro);
  publicar(texto);
  cronometro = setTimeout(() => publicar(""), DURACAO);
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function Avisos() {
  const texto = useSyncExternalStore(assinar, () => atual);
  // Direto no body, como o modo foco: dentro do #raiz o aviso ficaria por baixo do foco.
  return createPortal(
    <div role="status" aria-live="polite" className={estilos.regiao}>
      {texto && (
        <p key={texto} className={estilos.aviso}>
          {texto}
        </p>
      )}
    </div>,
    document.body,
  );
}
