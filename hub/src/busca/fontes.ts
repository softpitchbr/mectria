import { podeVer, SECOES } from "../../compartilhado/permissoes";
import { aplicarTema, salvarEscolhaTema, type EscolhaTema } from "../tema/tema";
import type { FonteDeBusca } from "./buscar";

const navegacao: FonteDeBusca = ({ eu, navegar }) =>
  SECOES.filter((s) => podeVer(eu.cargo, s.id)).map((s) => ({
    id: `ir-${s.id}`,
    titulo: `Ir para ${s.rotulo}`,
    grupo: "Navegação",
    palavras: [s.id, "abrir"],
    executar: () => navegar(s.caminho),
  }));

const TEMAS: [EscolhaTema, string][] = [
  ["sistema", "Usar tema do sistema"],
  ["escuro", "Usar tema escuro"],
  ["claro", "Usar tema claro"],
];

const tema: FonteDeBusca = () =>
  TEMAS.map(([escolha, titulo]) => ({
    id: `tema-${escolha}`,
    titulo,
    grupo: "Tema",
    palavras: ["aparência", "modo", "cor"],
    executar: () => {
      salvarEscolhaTema(escolha);
      aplicarTema(escolha);
    },
  }));

const conta: FonteDeBusca = () => [
  {
    id: "sair",
    titulo: "Sair",
    grupo: "Conta",
    palavras: ["logout", "deslogar", "trocar de conta"],
    executar: () => window.location.assign("/cdn-cgi/access/logout"),
  },
];

/** Fontes da fase 1. Objeções, clientes e roteiros entram aqui nas fases seguintes. */
export const FONTES: FonteDeBusca[] = [navegacao, tema, conta];
