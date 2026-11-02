import { Link, NavLink } from "react-router";
import { SECOES, type Secao } from "../../compartilhado/permissoes";
import Icone from "../componentes/Icone";
import Marca from "./Marca";
import estilos from "./BarraLateral.module.css";

/** Barra de ícones do notebook; o rótulo aparece ao passar o mouse. */
export default function BarraLateral({ secoes }: { secoes: Secao[] }) {
  const itens = SECOES.filter((s) => secoes.includes(s.id));
  return (
    <aside className={estilos.barra}>
      <Link to="/" className={estilos.marca} aria-label="Hub comercial MecTRIA">
        <Marca />
      </Link>
      <nav aria-label="Seções">
        <ul>
          {itens.map((s) => (
            <li key={s.id}>
              <NavLink to={s.caminho} end={s.caminho === "/"} aria-label={s.rotulo} className={estilos.item}>
                <Icone nome={s.icone} />
                <span className={estilos.dica} aria-hidden="true">
                  {s.rotulo}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
