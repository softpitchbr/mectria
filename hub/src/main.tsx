import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilo/tokens.css";
import { aplicarTema, lerEscolhaTema } from "./tema/tema";
import App from "./App";

aplicarTema(lerEscolhaTema());

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Elemento #raiz não encontrado em index.html");

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
