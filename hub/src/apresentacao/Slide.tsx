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

/**
 * Um slide da apresentação, no visual claro da MecTRIA. O quadro é 16:9 e tudo é medido em cqw,
 * então o mesmo slide serve para a janela do cliente, a miniatura do painel e o catálogo.
 */
export default function Slide({ slide, destacarFaltas = false }: { slide: SlideMontado; destacarFaltas?: boolean }) {
  const capa = slide.id === "capa";
  return (
    <div className={estilos.moldura}>
      <section className={capa ? estilos.capa : estilos.slide} aria-label={`Slide: ${texto(slide.titulo)}`}>
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
