import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import Icone from "../componentes/Icone";
import type { Eu } from "../sessao/useEu";
import { buscar } from "./buscar";
import { FONTES } from "./fontes";
import estilos from "./Busca.module.css";

/** Busca geral (Ctrl K): navegação, tema e conta; as fases seguintes acrescentam fontes. */
export default function Busca({ eu, aoFechar }: { eu: Eu; aoFechar: () => void }) {
  const navegar = useNavigate();
  const [consulta, setConsulta] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const idLista = useId();
  const idTitulo = useId();

  const itens = useMemo(() => FONTES.flatMap((fonte) => fonte({ eu, navegar: (c) => navegar(c) })), [eu, navegar]);
  const resultados = useMemo(() => buscar(consulta, itens), [consulta, itens]);

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    campo.current?.focus();
    return () => antes?.focus?.();
  }, []);

  function executar(indice: number) {
    const item = resultados[indice];
    if (!item) return;
    aoFechar();
    item.executar();
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    const total = resultados.length;
    if (e.key === "ArrowDown" && total) {
      e.preventDefault();
      setSelecionado((s) => (s + 1) % total);
    } else if (e.key === "ArrowUp" && total) {
      e.preventDefault();
      setSelecionado((s) => (s - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      executar(selecionado);
    } else if (e.key === "Escape") {
      e.preventDefault();
      aoFechar();
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  }

  const idOpcao = (i: number) => `${idLista}-${i}`;

  return (
    <div className={estilos.veu} onPointerDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div role="dialog" aria-modal="true" aria-labelledby={idTitulo} className={estilos.caixa}>
        <h2 id={idTitulo} className={estilos.escondido}>
          Buscar no hub
        </h2>
        <div className={estilos.entrada}>
          <Icone nome="busca" tamanho={18} />
          <input
            ref={campo}
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={resultados.length ? idOpcao(selecionado) : undefined}
            aria-label="O que você procura?"
            placeholder="Buscar seções, temas e ações…"
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setSelecionado(0);
            }}
            onKeyDown={aoTeclar}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id={idLista} role="listbox" aria-label="Resultados" className={estilos.lista}>
          {resultados.map((item, i) => (
            <li
              key={item.id}
              id={idOpcao(i)}
              role="option"
              aria-selected={i === selecionado}
              className={estilos.item}
              onPointerMove={() => setSelecionado(i)}
              onClick={() => executar(i)}
            >
              <span className={`mono ${estilos.grupo}`}>{item.grupo}</span>
              <span data-titulo>{item.titulo}</span>
            </li>
          ))}
        </ul>
        {resultados.length === 0 && <p className={`suave ${estilos.vazio}`}>Nada encontrado para “{consulta.trim()}”.</p>}
      </div>
    </div>
  );
}
