import HojeProjetos from "./hoje/HojeProjetos";
import type { Eu } from "../sessao/useEu";
import HojeCloser from "./hoje/HojeCloser";
import HojeDiretor from "./hoje/HojeDiretor";
import HojeHunter from "./hoje/HojeHunter";
import estilos from "./Hoje.module.css";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function saudacao(agora: Date): string {
  const hora = agora.getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function dataPorExtenso(agora: Date): string {
  return `${DIAS[agora.getDay()]}, ${agora.getDate()} de ${MESES[agora.getMonth()]}`;
}

/** Hoje: a saudação e o bloco do cargo. */
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
      {eu.cargo === "hunter" && <HojeHunter eu={eu} />}
      {eu.cargo === "closer" && <HojeCloser />}
      {eu.cargo === "diretor" && <HojeDiretor />}
      {eu.cargo === "projetos" && <HojeProjetos />}
    </div>
  );
}
