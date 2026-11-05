import { useMemo, useState } from "react";
import { OBJECOES } from "../../compartilhado/dados/objecoes";
import { normalizar } from "../../compartilhado/texto";
import estilos from "./Painel.module.css";

const DA_PROPOSTA = OBJECOES.filter((o) => o.etapas.includes("proposta"));

/** As objeções da etapa de proposta (tecla O), com busca. Esc fecha. */
export default function ObjecoesDaReuniao({ aoFechar }: { aoFechar: () => void }) {
  const [busca, setBusca] = useState("");
  const lista = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean);
    return DA_PROPOSTA.filter((o) => {
      const texto = normalizar(`${o.objecao} ${o.porTras} ${o.contorno}`);
      return termos.every((t) => texto.includes(t));
    });
  }, [busca]);

  return (
    <section className={estilos.objecoes} aria-label="Objeções">
      <div className={estilos.objecoesTopo}>
        <h3 className={estilos.subtitulo}>Objeções</h3>
        <button type="button" className={estilos.sair} onClick={aoFechar}>
          Fechar <kbd>Esc</kbd>
        </button>
      </div>
      <input
        type="search"
        aria-label="Buscar objeção"
        className={estilos.campo}
        placeholder="O que o cliente disse?"
        autoFocus
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            aoFechar();
          }
        }}
      />
      <ul className={estilos.listaObjecoes}>
        {lista.map((o) => (
          <li key={o.id}>
            <p className={estilos.objecao}>“{o.objecao}”</p>
            <p className="suave">Por trás: {o.porTras}</p>
            <p>{o.contorno}</p>
          </li>
        ))}
        {lista.length === 0 && <li className="suave">Nenhuma objeção com esse texto.</li>}
      </ul>
    </section>
  );
}
