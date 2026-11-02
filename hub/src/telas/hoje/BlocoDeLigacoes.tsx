import { useEffect, useState } from "react";
import { ROTEIRO_COLD_CALL } from "../../../compartilhado/dados/cold-call";
import { preencherModelo } from "../../../compartilhado/cadencia";
import type { ContagemLigacoes, ResultadoLigacao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import Medidor from "../../componentes/Medidor";
import NumeroRolante from "../../componentes/NumeroRolante";
import type { Eu } from "../../sessao/useEu";
import { mensagemDe } from "../followup/comum";
import { primeiroNome } from "./comum";
import MarcarDiagnostica from "./MarcarDiagnostica";
import estilos from "./hoje.module.css";

const BOTOES: { resultado: Exclude<ResultadoLigacao, "marcou">; rotulo: string; tecla: string }[] = [
  { resultado: "nao_atendeu", rotulo: "Não atendeu", tecla: "1" },
  { resultado: "atendeu", rotulo: "Atendeu", tecla: "2" },
];

/** O bloco de ligações em foco: roteiro à esquerda, contador e resultados (teclas 1, 2 e 3) à direita. */
export default function BlocoDeLigacoes({ eu, inicial, aoMudar }: { eu: Eu; inicial: ContagemLigacoes; aoMudar: (c: ContagemLigacoes) => void }) {
  const [contagem, setContagem] = useState(inicial);
  const [marcando, setMarcando] = useState(false);
  const [erro, setErro] = useState("");

  async function registrar(resultado: ResultadoLigacao) {
    setErro("");
    try {
      const nova = await api<ContagemLigacoes>("/api/ligacoes", { method: "POST", body: JSON.stringify({ resultado }) });
      setContagem(nova);
      aoMudar(nova);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  useEffect(() => {
    if (marcando) return;
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.repeat || alvo.closest("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "1") void registrar("nao_atendeu");
      else if (e.key === "2") void registrar("atendeu");
      else if (e.key === "3") setMarcando(true);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [marcando]);

  const valores = { vendedor: primeiroNome(eu.nome) };
  const metaBatida = contagem.total >= contagem.meta;

  if (marcando) {
    return (
      <MarcarDiagnostica
        aoVoltar={() => setMarcando(false)}
        aoMarcar={async () => {
          setMarcando(false);
          try {
            const nova = await api<ContagemLigacoes>("/api/ligacoes");
            setContagem(nova);
            aoMudar(nova);
          } catch {
            /* a contagem volta na próxima ligação */
          }
        }}
      />
    );
  }

  return (
    <div className={estilos.bloco}>
      <ol className={estilos.roteiro} aria-label="Roteiro da ligação">
        {ROTEIRO_COLD_CALL.map((passo) => (
          <li key={passo.titulo}>
            <h3>{passo.titulo}</h3>
            <p>{preencherModelo(passo.fala, valores)}</p>
            {passo.dica && <p className="suave">{passo.dica}</p>}
          </li>
        ))}
      </ol>
      <aside className={estilos.painelLigacoes}>
        <p className={estilos.total}>
          <NumeroRolante valor={contagem.total} /> <span className="suave">ligações hoje</span>
        </p>
        <Medidor rotulo="Ligações de hoje" valor={contagem.total} total={contagem.meta} texto={`${contagem.total}/${contagem.meta}`} />
        {metaBatida && <p className={estilos.meta}>Meta do dia batida</p>}
        <p className="suave">{contagem.naoAtendeu} sem resposta</p>
        <div className={estilos.resultados}>
          {BOTOES.map((b) => (
            <button key={b.resultado} type="button" className={estilos.resultado} onClick={() => registrar(b.resultado)}>
              <kbd>{b.tecla}</kbd>
              {b.rotulo}
            </button>
          ))}
          <button type="button" className={`${estilos.resultado} ${estilos.marcou}`} onClick={() => setMarcando(true)}>
            <kbd>3</kbd>
            Marcou diagnóstica
          </button>
        </div>
        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}
      </aside>
    </div>
  );
}
