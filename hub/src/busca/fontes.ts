import { OBJECOES } from "../../compartilhado/dados/objecoes";
import type { Oportunidade } from "../../compartilhado/oportunidade";
import { podeMarcarDiagnostica, podeVer, SECOES } from "../../compartilhado/permissoes";
import { api } from "../api/cliente";
import { aplicarTema, salvarEscolhaTema, type EscolhaTema } from "../tema/tema";
import type { FonteAssincrona, FonteDeBusca } from "./buscar";

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

const PLAYBOOKS: { aba: string; titulo: string; soCloser: boolean }[] = [
  { aba: "cold-call", titulo: "Roteiro de cold call", soCloser: false },
  { aba: "diagnostica", titulo: "Roteiro da diagnóstica (GPCTBA + C&I)", soCloser: true },
  { aba: "proposta", titulo: "Roteiro da apresentação de proposta", soCloser: true },
  { aba: "objecoes", titulo: "Guia de objeções", soCloser: false },
  { aba: "follow-up", titulo: "Cadência de follow-up", soCloser: true },
];

const roteiros: FonteDeBusca = ({ eu, navegar }) =>
  podeVer(eu.cargo, "playbooks")
    ? PLAYBOOKS.filter((p) => !p.soCloser || eu.cargo !== "hunter").map((p) => ({
        id: `roteiro-${p.aba}`,
        titulo: p.titulo,
        grupo: "Roteiro",
        palavras: ["playbook", "script"],
        executar: () => navegar(`/playbooks/${p.aba}`),
      }))
    : [];

const objecoes: FonteDeBusca = ({ eu, navegar }) =>
  podeVer(eu.cargo, "playbooks")
    ? OBJECOES.map((o) => ({
        id: `objecao-${o.id}`,
        titulo: o.objecao,
        grupo: "Objeção",
        palavras: ["objeção"],
        executar: () => navegar(`/playbooks/objecoes?o=${o.id}`),
      }))
    : [];

/** Fontes que já estão no código (navegação, tema, conta, roteiros e objeções). */
export const FONTES: FonteDeBusca[] = [navegacao, tema, conta, roteiros, objecoes];

const clientes: FonteAssincrona = async ({ eu, navegar }) => {
  if (!podeMarcarDiagnostica(eu.cargo)) return [];
  const lista = await api<Oportunidade[]>("/api/oportunidades");
  return lista.map((o) => ({
    id: `cliente-${o.id}`,
    titulo: o.empresa,
    grupo: "Cliente",
    palavras: [o.contato],
    executar: () =>
      navegar(eu.cargo === "hunter" ? "/" : o.situacao === "em_followup" ? "/follow-up" : o.situacao === "diagnostica_marcada" || o.situacao === "proposta_marcada" ? "/reunioes" : "/follow-up"),
  }));
};

/** Fontes que dependem da API; carregadas quando a busca abre. */
export const FONTES_ASSINCRONAS: FonteAssincrona[] = [clientes];
