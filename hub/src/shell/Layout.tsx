import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { secoesDoCargo } from "../../compartilhado/permissoes";
import Busca from "../busca/Busca";
import type { Eu } from "../sessao/useEu";
import BarraDeBaixo from "./BarraDeBaixo";
import BarraLateral from "./BarraLateral";
import Topo from "./Topo";
import estilos from "./Layout.module.css";

/** Moldura das telas de quem entrou: barras, topo, busca e o conteúdo da seção. */
export default function Layout({ eu }: { eu: Eu }) {
  const secoes = secoesDoCargo(eu.cargo);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscando((b) => !b);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  return (
    <div className={estilos.layout}>
      <BarraLateral secoes={secoes} />
      <div className={estilos.area}>
        <Topo eu={eu} aoBuscar={() => setBuscando(true)} />
        <main id="conteudo" className={estilos.conteudo}>
          <Outlet context={eu} />
        </main>
      </div>
      <BarraDeBaixo secoes={secoes} />
      {buscando && <Busca eu={eu} aoFechar={() => setBuscando(false)} />}
    </div>
  );
}
