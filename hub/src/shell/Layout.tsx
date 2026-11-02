import { Outlet } from "react-router";
import { secoesDoCargo } from "../../compartilhado/permissoes";
import type { Eu } from "../sessao/useEu";
import BarraDeBaixo from "./BarraDeBaixo";
import BarraLateral from "./BarraLateral";
import Topo from "./Topo";
import estilos from "./Layout.module.css";

/** Moldura das telas de quem entrou: barras, topo e o conteúdo da seção. */
export default function Layout({ eu, aoBuscar }: { eu: Eu; aoBuscar?: () => void }) {
  const secoes = secoesDoCargo(eu.cargo);
  return (
    <div className={estilos.layout}>
      <BarraLateral secoes={secoes} />
      <div className={estilos.area}>
        <Topo eu={eu} aoBuscar={aoBuscar} />
        <main id="conteudo" className={estilos.conteudo}>
          <Outlet context={eu} />
        </main>
      </div>
      <BarraDeBaixo secoes={secoes} />
    </div>
  );
}
