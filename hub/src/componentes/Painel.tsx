import { useRef, type HTMLAttributes } from "react";
import { usePosicaoNoElemento } from "../efeitos/luz";
import estilos from "./Painel.module.css";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Painel em foco: um degrau mais claro que o painel comum. */
  foco?: boolean;
};

export default function Painel({ foco = false, className, ...resto }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  usePosicaoNoElemento(ref);
  const classes = [estilos.painel, foco && estilos.foco, className].filter(Boolean).join(" ");
  return <div ref={ref} className={classes} {...resto} />;
}
