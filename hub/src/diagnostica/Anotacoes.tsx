import { useState, type KeyboardEvent } from "react";
import { ROTULO_MARCACAO, type Anotacao, type Marcacao } from "../../compartilhado/diagnostica";
import estilos from "./Painel.module.css";

const MARCACOES = Object.keys(ROTULO_MARCACAO) as Marcacao[];

/** Anotações livres: N abre o campo, Enter salva, Esc fecha. Cada uma leva o minuto e o passo. */
export default function Anotacoes({
  anotacoes,
  aberto,
  aoAbrir,
  aoFechar,
  aoSalvar,
}: {
  anotacoes: Anotacao[];
  aberto: boolean;
  aoAbrir: () => void;
  aoFechar: () => void;
  aoSalvar: (texto: string, marcacao: Marcacao | null) => void;
}) {
  const [texto, setTexto] = useState("");
  const [marcacao, setMarcacao] = useState<Marcacao | null>(null);

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!texto.trim()) return;
      aoSalvar(texto.trim(), marcacao);
      setTexto("");
      setMarcacao(null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      aoFechar();
    }
  }

  return (
    <aside className={estilos.anotacoes}>
      <div className={estilos.anotacoesTopo}>
        <h3>Anotações</h3>
        {!aberto && (
          <button type="button" className={estilos.botaoAnotar} onClick={aoAbrir}>
            <kbd>N</kbd> Anotar
          </button>
        )}
      </div>
      {aberto && (
        <div className={estilos.novaAnotacao}>
          <div className={estilos.marcacoes} role="group" aria-label="Marcação">
            {MARCACOES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={marcacao === m}
                className={estilos.marcacao}
                data-marcacao={m}
                onClick={() => setMarcacao(marcacao === m ? null : m)}
              >
                {ROTULO_MARCACAO[m]}
              </button>
            ))}
          </div>
          <textarea
            aria-label="Anotação"
            maxLength={2000}
            autoFocus
            rows={3}
            className={estilos.resposta}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Enter salva · Esc fecha"
          />
        </div>
      )}
      <ul className={estilos.listaAnotacoes} aria-label="Anotações">
        {[...anotacoes].reverse().map((a) => (
          <li key={a.idCliente} data-marcacao={a.marcacao ?? ""}>
            <span className="mono suave">
              {a.minuto} min{a.marcacao ? ` · ${ROTULO_MARCACAO[a.marcacao]}` : ""}
            </span>
            <p>{a.texto}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
