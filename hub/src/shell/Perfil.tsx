import { useEffect, useId, useRef, useState } from "react";
import { ROTULO_CARGO } from "../../compartilhado/cargos";
import Icone from "../componentes/Icone";
import type { Eu } from "../sessao/useEu";
import ChaveTema from "../tema/ChaveTema";
import estilos from "./Perfil.module.css";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** Botão do perfil no topo: nome, cargo, tema e sair. */
export default function Perfil({ eu }: { eu: Eu }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const idPainel = useId();

  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e: PointerEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", aoClicarFora);
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoClicarFora);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <div className={estilos.perfil} ref={caixa}>
      <button
        type="button"
        className={estilos.botao}
        aria-label={`Perfil de ${eu.nome}`}
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((a) => !a)}
      >
        <span className={estilos.avatar} aria-hidden="true">
          {iniciais(eu.nome)}
        </span>
        <span className={estilos.nomeCurto} aria-hidden="true">
          {eu.nome.split(" ")[0]}
        </span>
      </button>
      {aberto && (
        <div id={idPainel} className={estilos.painel}>
          <div className={estilos.quem}>
            <span className={estilos.avatarGrande} aria-hidden="true">
              {iniciais(eu.nome)}
            </span>
            <div>
              <p className={estilos.nome}>{eu.nome}</p>
              <p className="mono suave">{eu.email}</p>
            </div>
          </div>
          <dl className={estilos.dados}>
            <dt className="suave">Cargo</dt>
            <dd>{ROTULO_CARGO[eu.cargo]}</dd>
          </dl>
          <div className={estilos.tema}>
            <span className="suave">Tema</span>
            <ChaveTema />
          </div>
          <a className={estilos.sair} href="/cdn-cgi/access/logout">
            <Icone nome="sair" tamanho={18} />
            Sair
          </a>
        </div>
      )}
    </div>
  );
}
