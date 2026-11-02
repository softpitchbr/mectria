import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { SECOES, type Secao } from "../../compartilhado/permissoes";
import Icone from "../componentes/Icone";
import estilos from "./BarraDeBaixo.module.css";

const NA_BARRA = 4;

/** Celular (até 760 px): até 4 seções embaixo e "Mais" com as outras. */
export default function BarraDeBaixo({ secoes }: { secoes: Secao[] }) {
  const itens = SECOES.filter((s) => secoes.includes(s.id));
  const naBarra = itens.slice(0, NA_BARRA);
  const outras = itens.slice(NA_BARRA);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberta(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta]);

  return (
    <div className={estilos.base}>
      {aberta && (
        <>
          <div className={estilos.veu} onClick={() => setAberta(false)} aria-hidden="true" />
          <nav aria-label="Mais seções" id="mais-secoes" className={estilos.folha}>
            {outras.map((s) => (
              <NavLink key={s.id} to={s.caminho} className={estilos.linha} onClick={() => setAberta(false)}>
                <Icone nome={s.icone} />
                {s.rotulo}
              </NavLink>
            ))}
          </nav>
        </>
      )}
      <div className={estilos.barra}>
        <nav aria-label="Seções no celular" className={estilos.itens}>
          {naBarra.map((s) => (
            <NavLink
              key={s.id}
              to={s.caminho}
              end={s.caminho === "/"}
              aria-label={s.rotulo}
              className={estilos.item}
              onClick={() => setAberta(false)}
            >
              <Icone nome={s.icone} />
              <span aria-hidden="true">{s.rotulo}</span>
            </NavLink>
          ))}
        </nav>
        {outras.length > 0 && (
          <button
            type="button"
            className={estilos.item}
            aria-expanded={aberta}
            aria-controls="mais-secoes"
            onClick={() => setAberta((a) => !a)}
          >
            <Icone nome={aberta ? "fechar" : "mais"} />
            <span>Mais</span>
          </button>
        )}
      </div>
    </div>
  );
}
