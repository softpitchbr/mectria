import { useId, type TextareaHTMLAttributes } from "react";
import estilos from "./Campo.module.css";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string };

export default function AreaDeTexto({ rotulo, id, className, rows = 3, ...resto }: Props) {
  const automatico = useId();
  const idCampo = id ?? automatico;
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={idCampo}>{rotulo}</label>
      <textarea id={idCampo} rows={rows} className={estilos.area} {...resto} />
    </div>
  );
}
