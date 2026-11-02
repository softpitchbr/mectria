import type { ButtonHTMLAttributes } from "react";
import estilos from "./Botao.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Só um "primario" (vermelho) por tela. */
  variante?: "primario" | "secundario" | "fantasma";
};

export default function Botao({ variante = "secundario", type = "button", className, ...resto }: Props) {
  const classes = [estilos.botao, estilos[variante], className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...resto} />;
}
