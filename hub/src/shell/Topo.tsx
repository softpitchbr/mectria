import Icone from "../componentes/Icone";
import type { Eu } from "../sessao/useEu";
import Marca from "./Marca";
import Perfil from "./Perfil";
import estilos from "./Topo.module.css";

/** Topo: marca (só no celular), busca e perfil. */
export default function Topo({ eu, aoBuscar }: { eu: Eu; aoBuscar?: () => void }) {
  return (
    <header className={estilos.topo}>
      <span className={estilos.marcaCelular} aria-hidden="true">
        <Marca tamanho={30} />
        <span>Hub comercial</span>
      </span>
      <button type="button" className={estilos.busca} onClick={aoBuscar} aria-label="Buscar · Ctrl K">
        <Icone nome="busca" tamanho={17} />
        <span className={estilos.texto}>Buscar</span>
        <kbd className={estilos.atalho}>Ctrl K</kbd>
      </button>
      <Perfil eu={eu} />
    </header>
  );
}
