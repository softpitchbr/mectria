import Botao from "../componentes/Botao";
import Campo from "../componentes/Campo";
import Icone from "../componentes/Icone";
import Painel from "../componentes/Painel";
import Tag from "../componentes/Tag";
import { avisar } from "../componentes/Aviso";
import ChaveTema from "../tema/ChaveTema";
import type { NomeIcone } from "../../compartilhado/icones";
import estilos from "./Vitrine.module.css";

const ICONES: NomeIcone[] = [
  "hoje",
  "reunioes",
  "followup",
  "playbooks",
  "apresentacoes",
  "rotinas",
  "time",
  "briefings",
  "busca",
  "sair",
  "mais",
  "fechar",
];

/** Conferência visual dos componentes (só em desenvolvimento). */
export default function Vitrine() {
  return (
    <main className={estilos.pagina}>
      <header className={estilos.cabeca}>
        <div>
          <p className="mono suave">VITRINE · FASE 1</p>
          <h1>Componentes da Prancheta</h1>
        </div>
        <ChaveTema />
      </header>

      <section className={estilos.bloco}>
        <h2>Botões</h2>
        <div className={estilos.linha}>
          <Botao variante="primario" onClick={() => avisar("Reunião iniciada")}>
            Iniciar reunião
          </Botao>
          <Botao onClick={() => avisar("Salvo")}>Salvar</Botao>
          <Botao variante="fantasma">Cancelar</Botao>
          <Botao disabled>Indisponível</Botao>
        </div>
      </section>

      <section className={estilos.bloco}>
        <h2>Painéis</h2>
        <div className={estilos.grade}>
          <Painel>
            <p className="mono suave">14:00 · DIAGNÓSTICA</p>
            <h3>Usinagem Triângulo Ltda.</h3>
            <p className="suave">Passe o cursor: o cartão acende onde ele está.</p>
          </Painel>
          <Painel foco>
            <p className="mono suave">EM FOCO</p>
            <h3>Painel em foco</h3>
            <p className="suave">Um degrau mais claro que o painel comum.</p>
          </Painel>
        </div>
      </section>

      <section className={estilos.bloco}>
        <h2>Etiquetas</h2>
        <div className={estilos.linha}>
          <Tag>Proposta</Tag>
          <Tag tipo="hoje">Hoje</Tag>
          <Tag tipo="atrasado">Atrasado 3 dias</Tag>
        </div>
      </section>

      <section className={estilos.bloco}>
        <h2>Campos</h2>
        <div className={estilos.grade}>
          <Campo rotulo="E-mail" type="email" placeholder="nome@mectria.com" />
          <Campo rotulo="Nome" placeholder="Nome completo" />
        </div>
      </section>

      <section className={estilos.bloco}>
        <h2>Ícones</h2>
        <div className={estilos.icones}>
          {ICONES.map((nome) => (
            <figure key={nome}>
              <Icone nome={nome} tamanho={22} />
              <figcaption className="mono suave">{nome}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
