import Painel from "../componentes/Painel";
import type { Eu } from "../sessao/useEu";
import estilos from "./Hoje.module.css";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function saudacao(agora: Date): string {
  const hora = agora.getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function dataPorExtenso(agora: Date): string {
  return `${DIAS[agora.getDay()]}, ${agora.getDate()} de ${MESES[agora.getMonth()]}`;
}

/** Hoje: a saudação. A agenda, os follow-ups e as rotinas do dia chegam na fase 2. */
export default function Hoje({ eu }: { eu: Eu }) {
  const agora = new Date();
  const primeiroNome = eu.nome.trim().split(/\s+/)[0];
  return (
    <div className={estilos.hoje}>
      <header className={estilos.cabeca}>
        <p className="mono suave">{dataPorExtenso(agora)}</p>
        <h1>
          {saudacao(agora)}, {primeiroNome}
        </h1>
      </header>
      <Painel className={estilos.aviso}>
        <p className="mono suave">EM CONSTRUÇÃO</p>
        <p>A agenda do dia, os follow-ups atrasados e as suas rotinas aparecem aqui a partir da fase 2.</p>
      </Painel>
    </div>
  );
}
