import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import type { DaApresentacao } from "../../compartilhado/contrato-apresentacao";
import { abrirCanal, type ApresentacaoNaJanela } from "../reuniao/canal";
import QuadroDoHtml, { type ControleDoQuadro } from "./QuadroDoHtml";
import Slide from "./Slide";
import estilos from "./JanelaDaApresentacao.module.css";

/**
 * A janela que o cliente vê (a que o vendedor compartilha no Meet ou no Zoom). Não fala com o servidor:
 * recebe tudo do painel pelo canal da reunião. Desenha a apresentação de exemplo ou abre a do serviço
 * em HTML (isolada) e repassa ao painel o que ela contar. Nunca mostra roteiro nem aviso.
 */
export default function JanelaDaApresentacao() {
  const { id } = useParams();
  const reuniaoId = Number(id);
  const [estado, setEstado] = useState<{ empresa: string; slide: number; apresentacao: ApresentacaoNaJanela } | null>(null);
  const canal = useRef<ReturnType<typeof abrirCanal> | null>(null);
  const quadro = useRef<ControleDoQuadro>(null);

  useEffect(() => {
    document.title = "Apresentação · MecTRIA";
    const c = abrirCanal(reuniaoId, (m) => {
      if (m.tipo === "estado") setEstado({ empresa: m.empresa, slide: m.slide, apresentacao: m.apresentacao });
      else if (m.tipo === "slide") setEstado((e) => (e ? { ...e, slide: m.slide } : e));
      else if (m.tipo === "acionar") quadro.current?.acionar(m.acao);
      else if (m.tipo === "calcular") quadro.current?.calcular(m.valores);
      else if (m.tipo === "fim") window.close();
    });
    canal.current = c;
    c.enviar({ tipo: "pronta" });
    const viva = setInterval(() => c.enviar({ tipo: "viva" }), 2000);
    // O vendedor não deveria tocar nesta janela; se apertar as setas aqui, o painel passa o slide.
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      c.enviar({ tipo: "tecla", tecla: e.key });
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      clearInterval(viva);
      window.removeEventListener("keydown", aoTeclar);
      c.fechar();
      canal.current = null;
    };
  }, [reuniaoId]);

  useEffect(() => {
    if (estado?.empresa) document.title = `Apresentação · ${estado.empresa}`;
  }, [estado?.empresa]);

  function daApresentacao(m: DaApresentacao) {
    if (m.tipo === "tecla") canal.current?.enviar({ tipo: "tecla", tecla: m.tecla });
    else canal.current?.enviar({ tipo: "apresentacao", mensagem: m });
  }

  const apresentacao = estado?.apresentacao;
  if (estado && apresentacao?.tipo === "html") {
    return (
      <main className={estilos.janelaHtml} aria-label="Apresentação">
        <QuadroDoHtml
          ref={quadro}
          url={apresentacao.url}
          titulo={`Apresentação · ${estado.empresa}`}
          slide={estado.slide}
          dados={apresentacao.dados}
          interacoes={apresentacao.interacoes}
          aoReceber={daApresentacao}
        />
      </main>
    );
  }
  const slide = apresentacao?.tipo === "exemplo" ? apresentacao.slides[estado!.slide] : undefined;
  return (
    <main className={estilos.janela} aria-label="Apresentação">
      {slide ? (
        <div className={estilos.quadro}>
          <Slide slide={slide} />
        </div>
      ) : (
        <p className={estilos.espera}>MecTRIA</p>
      )}
    </main>
  );
}
