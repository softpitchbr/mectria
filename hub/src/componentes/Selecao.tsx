import { useId, type SelectHTMLAttributes } from "react";
import estilos from "./Campo.module.css";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  /** Primeira opção vazia, para obrigar a escolha. */
  vazio?: string;
};

export default function Selecao({ rotulo, opcoes, vazio, id, className, ...resto }: Props) {
  const automatico = useId();
  const idCampo = id ?? automatico;
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={idCampo}>{rotulo}</label>
      <select id={idCampo} className={estilos.selecao} {...resto}>
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
