import { PLAYBOOK_PROPOSTA } from "../../../compartilhado/dados/playbooks";
import { roteiroPadrao, type IdPacto } from "../../../compartilhado/proposta";
import type { SlideDoRoteiro } from "../../../compartilhado/servico";
import AreaDeTexto from "../../componentes/AreaDeTexto";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import { letrasAleatorias, mover } from "./edicao";
import estilos from "./EditarServico.module.css";

const PACTOS = PLAYBOOK_PROPOSTA.pactos.map((p) => ({ valor: p.id, rotulo: p.texto }));

/** O roteiro da apresentação de proposta do serviço: título, fala, dica, pacto e tempo de cada slide. */
export default function EditorDoRoteiro({ roteiro, aoMudar }: { roteiro: SlideDoRoteiro[] | null; aoMudar: (r: SlideDoRoteiro[] | null) => void }) {
  if (!roteiro) {
    return (
      <section aria-labelledby="titulo-roteiro" className={estilos.secao}>
        <h2 id="titulo-roteiro">Roteiro por slide</h2>
        <p>Usa o roteiro padrão (13 slides da apresentação de exemplo).</p>
        <p className="suave">Personalize quando a apresentação do serviço tiver outros slides. O roteiro precisa ter o mesmo número de slides da apresentação.</p>
        <Botao onClick={() => aoMudar(roteiroPadrao())}>Personalizar o roteiro</Botao>
      </section>
    );
  }
  const mudar = (i: number, parte: Partial<SlideDoRoteiro>) => aoMudar(roteiro.map((s, n) => (n === i ? { ...s, ...parte } : s)));

  return (
    <section aria-labelledby="titulo-roteiro" className={estilos.secao}>
      <h2 id="titulo-roteiro">Roteiro por slide</h2>
      <p className="suave">
        {roteiro.length} {roteiro.length === 1 ? "slide" : "slides"}. O painel mostra a fala, a dica, o pacto e o tempo de cada um; a apresentação precisa ter o mesmo número de slides.
      </p>
      {roteiro.map((s, i) => (
        <fieldset key={s.id} className={estilos.item}>
          <legend>Slide {i + 1}</legend>
          <Campo rotulo="Título" maxLength={120} value={s.titulo} onChange={(e) => mudar(i, { titulo: e.target.value })} />
          <AreaDeTexto rotulo="Fala" rows={3} maxLength={2000} value={s.fala} onChange={(e) => mudar(i, { fala: e.target.value })} />
          <Campo rotulo="Dica" maxLength={500} value={s.dica ?? ""} onChange={(e) => mudar(i, { dica: e.target.value || undefined })} />
          <div className={estilos.grade}>
            <Selecao
              rotulo="Pacto"
              vazio="Nenhum"
              opcoes={PACTOS}
              value={s.pacto ?? ""}
              onChange={(e) => mudar(i, { pacto: (e.target.value || null) as IdPacto | null })}
            />
            <Campo
              rotulo="Tempo (minutos)"
              type="number"
              min={1}
              max={30}
              value={Number.isFinite(s.tempo) ? String(s.tempo) : ""}
              onChange={(e) => mudar(i, { tempo: e.target.value === "" ? Number.NaN : Number(e.target.value) })}
            />
          </div>
          <div className={estilos.acoesDoItem}>
            <Botao variante="fantasma" disabled={i === 0} aria-label={`Subir o slide ${i + 1}`} onClick={() => aoMudar(mover(roteiro, i, -1))}>
              ↑ Subir
            </Botao>
            <Botao variante="fantasma" disabled={i === roteiro.length - 1} aria-label={`Descer o slide ${i + 1}`} onClick={() => aoMudar(mover(roteiro, i, 1))}>
              ↓ Descer
            </Botao>
            <Botao variante="fantasma" disabled={roteiro.length === 1} onClick={() => aoMudar(roteiro.filter((_, n) => n !== i))}>
              Remover
            </Botao>
          </div>
        </fieldset>
      ))}
      <div className={estilos.acoesDoItem}>
        <Botao onClick={() => aoMudar([...roteiro, { id: `slide-${letrasAleatorias()}`, titulo: "", fala: "", pacto: null, tempo: 2 }])}>Adicionar slide</Botao>
        <Botao variante="fantasma" onClick={() => aoMudar(null)}>
          Voltar ao roteiro padrão
        </Botao>
      </div>
    </section>
  );
}
