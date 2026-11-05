import { useLayoutEffect, useRef, useState } from "react";
import type { Parte, SlideMontado } from "../../compartilhado/proposta";
import estilos from "./Slide.module.css";

/** Desenha as partes; a pendência ([rótulo]) só fica destacada para o vendedor, nunca na janela do cliente. */
function Texto({ partes, destacarFaltas }: { partes: Parte[]; destacarFaltas: boolean }) {
  return (
    <>
      {partes.map((p, i) =>
        p.tipo === "falta" && destacarFaltas ? (
          <mark key={i} className={estilos.falta}>
            {p.texto}
          </mark>
        ) : (
          <span key={i}>{p.texto}</span>
        ),
      )}
    </>
  );
}

const texto = (partes: Parte[]) => partes.map((p) => p.texto).join("");

/** O slide é desenhado sempre em 1280 × 720 e reduzido (ou ampliado) para caber: as linhas quebram igual em qualquer tamanho. */
const LARGURA = 1280;

/**
 * Um slide da apresentação, no visual claro da MecTRIA. O mesmo slide serve para a janela do cliente,
 * a miniatura do painel e o catálogo.
 */
export default function Slide({ slide, destacarFaltas = false }: { slide: SlideMontado; destacarFaltas?: boolean }) {
  const capa = slide.id === "capa";
  const moldura = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);

  useLayoutEffect(() => {
    const el = moldura.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / LARGURA || 1);
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={moldura} className={estilos.moldura}>
      <section className={capa ? estilos.capa : estilos.slide} style={{ transform: `scale(${escala})` }} aria-label={`Slide: ${texto(slide.titulo)}`}>
        <p className={estilos.rotulo}>
          <Texto partes={slide.rotulo} destacarFaltas={destacarFaltas} />
        </p>
        <h2 className={estilos.titulo}>
          <Texto partes={slide.titulo} destacarFaltas={destacarFaltas} />
        </h2>
        {slide.linhas.length > 0 && (
          <ul className={estilos.linhas}>
            {slide.linhas.map((l, i) => (
              <li key={i}>
                <Texto partes={l} destacarFaltas={destacarFaltas} />
              </li>
            ))}
          </ul>
        )}
        <span className={estilos.marca}>MecTRIA</span>
      </section>
    </div>
  );
}
