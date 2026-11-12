import { useState } from "react";
import type { AcaoDoSlide, CampoDoSlide, Interacoes } from "../../compartilhado/contrato-apresentacao";
import Botao from "../componentes/Botao";
import estilos from "./Painel.module.css";

export interface DoDeck {
  slides: number;
  acoes: AcaoDoSlide[];
  campos: CampoDoSlide[];
}

/**
 * O painel diante da apresentação em HTML: as ações e os números do slide atual (o vendedor também aciona
 * daqui) e o que a apresentação contou. O aviso de roteiro diferente fica só aqui, nunca na janela do cliente.
 */
export default function NaApresentacao({
  slide,
  totalDoRoteiro,
  doDeck,
  interacoes,
  aoAcionar,
  aoCalcular,
}: {
  slide: number;
  totalDoRoteiro: number;
  doDeck: DoDeck | null;
  interacoes: Interacoes;
  aoAcionar: (acao: string) => void;
  aoCalcular: (valores: Record<string, number>) => void;
}) {
  // O que o vendedor está digitando: a apresentação devolve o número depois, pelo evento.
  const [digitado, setDigitado] = useState<Record<string, string>>({});
  const acoes = doDeck?.acoes.filter((a) => a.slide === slide) ?? [];
  const campos = doDeck?.campos.filter((c) => c.slide === slide) ?? [];
  const rotuloDoCampo = (id: string) => doDeck?.campos.find((c) => c.id === id)?.rotulo ?? id;
  const numeros = Object.entries(interacoes.calculadora);
  const contou = interacoes.dores.length > 0 || interacoes.precoEtapa > 0 || numeros.length > 0;

  function digitar(id: string, texto: string) {
    setDigitado((d) => ({ ...d, [id]: texto }));
    const n = Number(texto.replace(",", "."));
    if (texto.trim() === "" || !Number.isFinite(n)) return;
    aoCalcular({ ...interacoes.calculadora, [id]: n });
  }

  return (
    <>
      {doDeck && doDeck.slides !== totalDoRoteiro && (
        <p role="alert" className={estilos.alerta}>
          A apresentação tem {doDeck.slides} slides e o roteiro tem {totalDoRoteiro}. Ajuste o roteiro em Serviços.
        </p>
      )}
      {(acoes.length > 0 || campos.length > 0) && (
        <div className={estilos.acoesDoSlide}>
          {acoes.map((a) => (
            <Botao key={a.id} onClick={() => aoAcionar(a.id)}>
              {a.rotulo}
            </Botao>
          ))}
          {campos.map((c) => (
            <label key={c.id} className={estilos.campoDoSlide}>
              <span>{c.rotulo}</span>
              <input
                type="number"
                inputMode="decimal"
                value={digitado[c.id] ?? (interacoes.calculadora[c.id] !== undefined ? String(interacoes.calculadora[c.id]) : "")}
                onChange={(e) => digitar(c.id, e.target.value)}
              />
            </label>
          ))}
        </div>
      )}
      {contou && (
        <section aria-label="Na apresentação" className={estilos.naApresentacao}>
          <p className={`mono ${estilos.sobre}`}>NA APRESENTAÇÃO</p>
          {interacoes.dores.length > 0 && <p>Dores marcadas: {interacoes.dores.join(" · ")}</p>}
          {interacoes.precoEtapa > 0 && <p>Preço revelado até a etapa {interacoes.precoEtapa}</p>}
          {numeros.length > 0 && <p>{numeros.map(([id, n]) => `${rotuloDoCampo(id)}: ${n.toLocaleString("pt-BR")}`).join(" · ")}</p>}
        </section>
      )}
    </>
  );
}
