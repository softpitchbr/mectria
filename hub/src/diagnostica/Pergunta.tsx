import type { Pergunta as TipoPergunta } from "../../compartilhado/dados/diagnostica";
import estilos from "./Painel.module.css";

/** O campo da resposta conforme o tipo da pergunta. */
export default function Pergunta({ pergunta, valor, aoMudar }: { pergunta: TipoPergunta; valor: string; aoMudar: (v: string) => void }) {
  if (pergunta.tipo === "opcoes" && pergunta.opcoes) {
    return (
      <div className={estilos.opcoes} role="group" aria-label="Resposta">
        {pergunta.opcoes.map((o) => (
          <button key={o} type="button" aria-pressed={valor === o} className={estilos.opcao} onClick={() => aoMudar(valor === o ? "" : o)}>
            {o}
          </button>
        ))}
      </div>
    );
  }
  if (pergunta.tipo === "texto") {
    return (
      <textarea
        aria-label="Resposta"
        className={estilos.resposta}
        rows={5}
        value={valor}
        maxLength={2000}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder="As palavras do cliente, do jeito que ele falou"
      />
    );
  }
  return (
    <input
      aria-label="Resposta"
      className={estilos.resposta}
      inputMode={pergunta.tipo === "numero" ? "decimal" : undefined}
      value={valor}
      maxLength={2000}
      onChange={(e) => aoMudar(e.target.value)}
    />
  );
}
