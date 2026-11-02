import estilos from "./Marca.module.css";

/** Marca do hub: o "M" da MecTRIA num quadrado vinho. */
export default function Marca({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <span className={estilos.marca} style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      M
    </span>
  );
}
