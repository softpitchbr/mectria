import type { HTMLAttributes } from "react";
import estilos from "./Tag.module.css";

type Props = HTMLAttributes<HTMLSpanElement> & {
  tipo?: "neutro" | "atrasado" | "hoje";
};

export default function Tag({ tipo = "neutro", className, ...resto }: Props) {
  const classes = [estilos.tag, estilos[tipo], className].filter(Boolean).join(" ");
  return <span className={classes} {...resto} />;
}
