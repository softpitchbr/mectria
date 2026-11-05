import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type { SlideMontado } from "../../compartilhado/proposta";
import { abrirCanal } from "../reuniao/canal";
import Slide from "./Slide";
import estilos from "./JanelaDaApresentacao.module.css";

/**
 * A janela que o cliente vê (a que o vendedor compartilha no Meet ou no Zoom). Não fala com o servidor:
 * recebe tudo do painel pelo canal da reunião e só desenha o slide. Nunca mostra roteiro nem aviso.
 */
export default function JanelaDaApresentacao() {
  const { id } = useParams();
  const reuniaoId = Number(id);
  const [estado, setEstado] = useState<{ empresa: string; slides: SlideMontado[]; slide: number } | null>(null);

  useEffect(() => {
    document.title = "Apresentação · MecTRIA";
    const canal = abrirCanal(reuniaoId, (m) => {
      if (m.tipo === "estado") setEstado({ empresa: m.empresa, slides: m.slides, slide: m.slide });
      else if (m.tipo === "slide") setEstado((e) => (e ? { ...e, slide: m.slide } : e));
      else if (m.tipo === "fim") window.close();
    });
    canal.enviar({ tipo: "pronta" });
    const viva = setInterval(() => canal.enviar({ tipo: "viva" }), 2000);
    // O vendedor não deveria tocar nesta janela; se apertar as setas aqui, o painel passa o slide.
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      canal.enviar({ tipo: "tecla", tecla: e.key });
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      clearInterval(viva);
      window.removeEventListener("keydown", aoTeclar);
      canal.fechar();
    };
  }, [reuniaoId]);

  useEffect(() => {
    if (estado?.empresa) document.title = `Apresentação · ${estado.empresa}`;
  }, [estado?.empresa]);

  const slide = estado?.slides[estado.slide];
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
