import estilos from "./NumeroRolante.module.css";

/** Número que, quando muda, entra rolando de baixo (140 ms). */
export default function NumeroRolante({ valor, className }: { valor: number; className?: string }) {
  return (
    <span className={[estilos.numero, "mono", className].filter(Boolean).join(" ")} aria-live="polite">
      <span key={valor} className={estilos.entra}>
        {valor}
      </span>
    </span>
  );
}
