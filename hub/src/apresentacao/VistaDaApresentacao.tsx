import { useMemo, useRef, useState } from "react";
import { aplicarEvento, INTERACOES_VAZIAS, type DaApresentacao, type Interacoes } from "../../compartilhado/contrato-apresentacao";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { dadosDaApresentacao, roteiroPadrao, valoresDaProposta, variaveisIniciais } from "../../compartilhado/proposta";
import { urlDaApresentacao, type Servico } from "../../compartilhado/servico";
import Botao from "../componentes/Botao";
import NaApresentacao, { type DoDeck } from "../reuniao/NaApresentacao";
import QuadroDoHtml, { type ControleDoQuadro } from "./QuadroDoHtml";
import estilos from "./VistaDaApresentacao.module.css";

/**
 * Para o diretor (e o closer, no catálogo) ver a apresentação em HTML do serviço com dados de exemplo:
 * passa os slides, aciona as ações, digita os números e vê o que ela conta ao hub.
 */
export default function VistaDaApresentacao({ servico }: { servico: Servico }) {
  const url = urlDaApresentacao(servico)!;
  const [slide, setSlide] = useState(0);
  const [doDeck, setDoDeck] = useState<DoDeck | null>(null);
  const [interacoes, setInteracoes] = useState<Interacoes>(INTERACOES_VAZIAS);
  const quadro = useRef<ControleDoQuadro>(null);
  const totalDoRoteiro = (servico.roteiro ?? roteiroPadrao()).length;
  const total = doDeck?.slides ?? totalDoRoteiro;

  const dados = useMemo(() => {
    const variaveis = variaveisIniciais(servico.id, servico);
    const { valores } = valoresDaProposta({
      oportunidade: { empresa: "Cliente de exemplo", contato: "", servico: servico.id },
      variaveis,
      respostas: {},
      hoje: hojeEmSaoPaulo(),
      servico,
    });
    return dadosDaApresentacao(valores, variaveis, servico);
  }, [servico]);

  const ir = (n: number) => setSlide(Math.max(0, Math.min(total - 1, n)));

  function receber(m: DaApresentacao) {
    if (m.tipo === "pronta") setDoDeck({ slides: m.slides, acoes: m.acoes, campos: m.campos });
    else if (m.tipo === "tecla") ir(m.tecla === "ArrowRight" ? slide + 1 : slide - 1);
    else {
      const { mectria: _versao, tipo: _tipo, ...evento } = m;
      setInteracoes((i) => aplicarEvento(i, evento));
    }
  }

  return (
    <div className={estilos.vista}>
      <div className={estilos.moldura}>
        <QuadroDoHtml ref={quadro} url={url} titulo={`Apresentação · ${servico.nome}`} slide={slide} dados={dados} interacoes={INTERACOES_VAZIAS} aoReceber={receber} />
      </div>
      <div className={estilos.controles}>
        <Botao variante="fantasma" disabled={slide === 0} onClick={() => ir(slide - 1)}>
          Anterior
        </Botao>
        <span className="mono">
          Slide {slide + 1} de {total}
        </span>
        <Botao disabled={slide >= total - 1} onClick={() => ir(slide + 1)}>
          Próximo
        </Botao>
      </div>
      <NaApresentacao
        slide={slide}
        totalDoRoteiro={totalDoRoteiro}
        doDeck={doDeck}
        interacoes={interacoes}
        aoAcionar={(acao) => quadro.current?.acionar(acao)}
        aoCalcular={(valores) => quadro.current?.calcular(valores)}
      />
      <p className="suave">Com dados de exemplo: na reunião, a apresentação recebe os dados do cliente e da diagnóstica.</p>
    </div>
  );
}
