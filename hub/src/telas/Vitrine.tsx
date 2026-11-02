import { useState } from "react";
import Botao from "../componentes/Botao";
import Foco from "../componentes/Foco";
import Medidor from "../componentes/Medidor";
import NumeroRolante from "../componentes/NumeroRolante";
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
  const [origem, setOrigem] = useState<HTMLElement | null>(null);
  const [contador, setContador] = useState(1);
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
        <h2>Modo foco, medidor e número</h2>
        <div className={estilos.grade}>
          <Painel>
            <p className="mono suave">D3 · LIGAÇÃO · QUA, 18/11</p>
            <h3>Usinagem Triângulo Ltda.</h3>
            <p className="suave">O toque cresce a partir deste cartão.</p>
            <Botao onClick={(e) => setOrigem(e.currentTarget.closest("div") as HTMLElement)}>Abrir em foco</Botao>
          </Painel>
          <Painel>
            <Medidor rotulo="Ligações de hoje" valor={contador} total={2} texto={`${contador}/2`} />
            <p style={{ marginTop: 16 }}>
              <NumeroRolante valor={contador} /> ligações{" "}
              <Botao variante="fantasma" onClick={() => setContador((c) => c + 1)}>
                +1
              </Botao>
            </p>
          </Painel>
        </div>
        {origem && (
          <Foco titulo="Toque D3 · Ligação" origem={origem} aoSair={() => setOrigem(null)}>
            <h2>Saber em que pé está a decisão</h2>
            <p className="suave" style={{ margin: "8px 0 16px" }}>Na ligação: “Oi, Ana, é o Carlos, da MecTRIA…”</p>
            <Botao variante="primario">Registrar toque</Botao>
          </Foco>
        )}
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
