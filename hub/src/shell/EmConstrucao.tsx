import type { NomeIcone } from "../../compartilhado/icones";
import Icone from "../componentes/Icone";
import Painel from "../componentes/Painel";
import estilos from "./EmConstrucao.module.css";

/** Seção que ainda não foi construída: diz em que fase ela chega. */
export default function EmConstrucao({ secao, fase, icone }: { secao: string; fase: number; icone?: NomeIcone }) {
  return (
    <Painel className={estilos.cartao}>
      {icone && (
        <span className={estilos.icone}>
          <Icone nome={icone} tamanho={22} />
        </span>
      )}
      <h1>{secao}</h1>
      <p className="suave">
        {secao} chega na fase {fase}.
      </p>
    </Painel>
  );
}
