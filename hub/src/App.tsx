import { useEffect, useState } from "react";
import { createBrowserRouter, Link, RouterProvider, useOutletContext, type RouteObject } from "react-router";
import { podeVer, SECOES, type Secao } from "../compartilhado/permissoes";
import { Avisos } from "./componentes/Aviso";
import Botao from "./componentes/Botao";
import Painel from "./componentes/Painel";
import { useLuzDoCursor } from "./efeitos/luz";
import { useEu, type Eu } from "./sessao/useEu";
import EmConstrucao from "./shell/EmConstrucao";
import Layout from "./shell/Layout";
import SemAcesso from "./shell/SemAcesso";
import Hoje from "./telas/Hoje";
import Time from "./telas/Time";
import Vitrine from "./telas/Vitrine";
import estilos from "./App.module.css";

const TITULO = "Hub comercial MecTRIA";

/** Uma seção: confere o cargo, depois mostra a tela ou quando ela chega. */
function PaginaDaSecao({ secao }: { secao: Secao }) {
  const eu = useOutletContext<Eu>();
  const info = SECOES.find((s) => s.id === secao)!;

  useEffect(() => {
    document.title = `${info.rotulo} · ${TITULO}`;
  }, [info.rotulo]);

  if (!podeVer(eu.cargo, secao)) return <SemAcesso secao={info.rotulo} />;
  if (secao === "hoje") return <Hoje eu={eu} />;
  if (secao === "time") return <Time eu={eu} />;
  return <EmConstrucao secao={info.rotulo} fase={info.fase} icone={info.icone} />;
}

function NaoEncontrada() {
  return (
    <Painel className={estilos.aviso}>
      <p>Página não encontrada.</p>
      <Link to="/">Voltar para o Hoje</Link>
    </Painel>
  );
}

/** Abre a sessão e decide entre carregando, sem acesso, erro e o hub. */
function Raiz() {
  const sessao = useEu();
  if (sessao.estado === "carregando") {
    return (
      <p role="status" className={`mono suave ${estilos.carregando}`}>
        Abrindo o hub…
      </p>
    );
  }
  if (sessao.estado === "sem_acesso") return <SemAcesso />;
  if (sessao.estado === "erro") {
    return (
      <main className={estilos.tela}>
        <Painel className={estilos.aviso}>
          <p>{sessao.mensagem}</p>
          <Botao onClick={() => window.location.reload()}>Tentar de novo</Botao>
        </Painel>
      </main>
    );
  }
  return <Layout eu={sessao.eu} />;
}

function criarRotas(): RouteObject[] {
  const secoes: RouteObject[] = SECOES.map((s) =>
    s.caminho === "/"
      ? { index: true, element: <PaginaDaSecao secao={s.id} /> }
      : { path: s.caminho.slice(1), element: <PaginaDaSecao secao={s.id} /> },
  );
  const rotas: RouteObject[] = [
    { path: "/", element: <Raiz />, children: [...secoes, { path: "*", element: <NaoEncontrada /> }] },
  ];
  if (import.meta.env.DEV) rotas.unshift({ path: "/vitrine", element: <Vitrine /> });
  return rotas;
}

export default function App() {
  useLuzDoCursor();
  const [roteador] = useState(() => createBrowserRouter(criarRotas()));
  return (
    <>
      <RouterProvider router={roteador} />
      <Avisos />
    </>
  );
}
