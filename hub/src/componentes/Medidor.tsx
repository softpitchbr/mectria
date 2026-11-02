import estilos from "./Medidor.module.css";

/** A cota de desenho técnico como instrumento: linha com setas nas pontas e a medida no meio. */
export default function Medidor({ rotulo, valor, total, texto }: { rotulo: string; valor: number; total: number; texto: string }) {
  const proporcao = total > 0 ? Math.min(1, Math.max(0, valor / total)) : 0;
  return (
    <div
      className={estilos.medidor}
      role="meter"
      aria-label={rotulo}
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuetext={texto}
    >
      <div className={estilos.cabeca}>
        <span className={`mono ${estilos.rotulo}`}>{rotulo}</span>
        <span className={`mono ${estilos.texto}`}>{texto}</span>
      </div>
      <div className={estilos.cota} aria-hidden="true">
        <span className={estilos.trilho} />
        <span className={estilos.preenchido} data-preenchido style={{ width: `${proporcao * 100}%` }} />
      </div>
    </div>
  );
}
