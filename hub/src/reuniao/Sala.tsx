import { useState } from "react";
import type { PessoaNaSala } from "../../compartilhado/proposta";
import estilos from "./Painel.module.css";

/** Quem está na sala: acrescentar (Enter), marcar quem decide e tirar. */
export default function Sala({ sala, aoMudar }: { sala: PessoaNaSala[]; aoMudar: (sala: PessoaNaSala[]) => void }) {
  const [nome, setNome] = useState("");

  function acrescentar() {
    const n = nome.trim().replace(/\s+/g, " ");
    if (!n || sala.length >= 12) return;
    aoMudar([...sala, { nome: n.slice(0, 80), decide: false }]);
    setNome("");
  }

  return (
    <section className={estilos.sala} aria-labelledby="titulo-sala">
      <h3 id="titulo-sala" className={estilos.subtitulo}>
        Quem está na sala
      </h3>
      <ul aria-label="Quem está na sala" className={estilos.pessoas}>
        {sala.map((p, i) => (
          <li key={`${p.nome}-${i}`} data-decide={p.decide ? "sim" : undefined}>
            <span>{p.nome}</span>
            <label className={estilos.decide}>
              <input
                type="checkbox"
                aria-label={`${p.nome} decide`}
                checked={p.decide}
                onChange={() => aoMudar(sala.map((x, j) => (j === i ? { ...x, decide: !x.decide } : x)))}
              />
              decide
            </label>
            <button type="button" className={estilos.tirar} aria-label={`Tirar ${p.nome}`} onClick={() => aoMudar(sala.filter((_, j) => j !== i))}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <input
        aria-label="Adicionar pessoa"
        className={estilos.campo}
        placeholder="Nome e Enter"
        maxLength={80}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            acrescentar();
          }
        }}
      />
    </section>
  );
}
