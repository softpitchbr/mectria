import type { TipoPergunta } from "../../../compartilhado/dados/diagnostica";
import AreaDeTexto from "../../componentes/AreaDeTexto";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import Tag from "../../componentes/Tag";
import { letrasAleatorias, mover, type PerguntaEmEdicao } from "./edicao";
import estilos from "./EditarServico.module.css";

const TIPOS: { valor: TipoPergunta; rotulo: string }[] = [
  { valor: "texto", rotulo: "Resposta longa" },
  { valor: "curto", rotulo: "Resposta curta" },
  { valor: "opcoes", rotulo: "Opções" },
  { valor: "numero", rotulo: "Número" },
];
const BLOCOS = [
  { valor: "escopo", rotulo: "Escopo do serviço" },
  { valor: "parametros", rotulo: "Parâmetros técnicos" },
];

/** As perguntas técnicas da diagnóstica do serviço, na ordem em que aparecem no painel. */
export default function EditorDePerguntas({ perguntas, sigla, aoMudar }: { perguntas: PerguntaEmEdicao[]; sigla: string; aoMudar: (p: PerguntaEmEdicao[]) => void }) {
  const mudar = (i: number, parte: Partial<PerguntaEmEdicao>) => aoMudar(perguntas.map((p, n) => (n === i ? { ...p, ...parte } : p)));
  const prefixo = sigla.toLowerCase().replace(/[^a-z0-9]/g, "") || "pergunta";

  return (
    <section aria-labelledby="titulo-perguntas" className={estilos.secao}>
      <h2 id="titulo-perguntas">Perguntas técnicas da diagnóstica</h2>
      <p className="suave">Aparecem no painel da diagnóstica depois do GPCTBA + C&amp;I. A pergunta desativada sai das diagnósticas novas e continua nos briefings.</p>
      {perguntas.map((p, i) => (
        <fieldset key={p.id} className={estilos.item} data-inativa={p.inativa ? "sim" : undefined}>
          <legend>
            Pergunta {i + 1} {p.inativa && <Tag>Desativada</Tag>}
          </legend>
          <AreaDeTexto rotulo="Texto da pergunta" rows={2} maxLength={300} value={p.texto} onChange={(e) => mudar(i, { texto: e.target.value })} />
          <div className={estilos.grade}>
            <Selecao rotulo="Tipo" opcoes={TIPOS} value={p.tipo} onChange={(e) => mudar(i, { tipo: e.target.value as TipoPergunta })} />
            <Selecao rotulo="Bloco" opcoes={BLOCOS} value={p.bloco ?? "escopo"} onChange={(e) => mudar(i, { bloco: e.target.value })} />
          </div>
          {p.tipo === "opcoes" && (
            <AreaDeTexto
              rotulo="Opções (uma por linha)"
              rows={3}
              value={(p.opcoes ?? []).join("\n")}
              onChange={(e) => mudar(i, { opcoes: e.target.value.split("\n") })}
            />
          )}
          <Campo rotulo="Dica" maxLength={300} value={p.dica ?? ""} onChange={(e) => mudar(i, { dica: e.target.value })} />
          <div className={estilos.acoesDoItem}>
            <Botao variante="fantasma" disabled={i === 0} aria-label={`Subir a pergunta ${i + 1}`} onClick={() => aoMudar(mover(perguntas, i, -1))}>
              ↑ Subir
            </Botao>
            <Botao variante="fantasma" disabled={i === perguntas.length - 1} aria-label={`Descer a pergunta ${i + 1}`} onClick={() => aoMudar(mover(perguntas, i, 1))}>
              ↓ Descer
            </Botao>
            {p.nova ? (
              <Botao variante="fantasma" onClick={() => aoMudar(perguntas.filter((_, n) => n !== i))}>
                Remover
              </Botao>
            ) : (
              <Botao variante="fantasma" onClick={() => mudar(i, { inativa: !p.inativa })}>
                {p.inativa ? "Reativar" : "Desativar"}
              </Botao>
            )}
          </div>
        </fieldset>
      ))}
      <Botao onClick={() => aoMudar([...perguntas, { id: `${prefixo}-${letrasAleatorias()}`, tipo: "texto", texto: "", bloco: "escopo", nova: true }])}>
        Adicionar pergunta
      </Botao>
    </section>
  );
}
