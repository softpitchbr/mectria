import { useId, type InputHTMLAttributes } from "react";
import estilos from "./Campo.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
};

export default function Campo({ rotulo, id, className, ...resto }: Props) {
  const automatico = useId();
  const idCampo = id ?? automatico;
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={idCampo}>{rotulo}</label>
      <input id={idCampo} {...resto} />
    </div>
  );
}
