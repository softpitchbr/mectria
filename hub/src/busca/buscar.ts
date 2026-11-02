import { normalizar } from "../../compartilhado/texto";
import type { Eu } from "../sessao/useEu";

export interface ItemDeBusca {
  id: string;
  titulo: string;
  grupo: string;
  /** Termos extras que acham o item sem aparecer no título. */
  palavras?: string[];
  executar: () => void;
}

/** Cada fonte entrega os itens que a pessoa pode buscar. As fases seguintes só acrescentam fontes. */
export type FonteDeBusca = (ctx: { eu: Eu; navegar: (caminho: string) => void }) => ItemDeBusca[];

/** Plural do português para o singular, numa palavra já normalizada (objecoes → objecao). */
function singular(palavra: string): string {
  if (palavra.length <= 3) return palavra;
  if (palavra.endsWith("oes") || palavra.endsWith("aes")) return `${palavra.slice(0, -3)}ao`;
  if (palavra.endsWith("ais")) return `${palavra.slice(0, -3)}al`;
  if (palavra.endsWith("eis")) return `${palavra.slice(0, -3)}el`;
  if (palavra.endsWith("ns")) return `${palavra.slice(0, -2)}m`;
  if (/[rsz]es$/.test(palavra)) return palavra.slice(0, -2);
  if (palavra.endsWith("s")) return palavra.slice(0, -1);
  return palavra;
}

const noSingular = (texto: string) => texto.split(" ").map(singular).join(" ");

/** O texto cru acha quem ainda está digitando ("objeco"); o singular acha "objecao" em "Objeções". */
function contem(texto: string, trecho: string): boolean {
  return texto.includes(trecho) || noSingular(texto).includes(noSingular(trecho));
}

function comeca(texto: string, trecho: string): boolean {
  return texto.startsWith(trecho) || noSingular(texto).startsWith(noSingular(trecho));
}

function pontuar(item: ItemDeBusca, consulta: string, termos: string[]): number {
  const titulo = normalizar(item.titulo);
  const tudo = normalizar(`${item.titulo} ${(item.palavras ?? []).join(" ")}`);
  if (!termos.every((t) => contem(tudo, t))) return 0;
  if (comeca(titulo, consulta)) return 3;
  if (contem(` ${titulo}`, ` ${consulta}`)) return 2;
  return 1;
}

/** Busca sem acento e sem caixa; começo do título > começo de palavra > resto; empate pela ordem. */
export function buscar(consulta: string, itens: ItemDeBusca[], limite = 8): ItemDeBusca[] {
  const c = normalizar(consulta);
  if (!c) return itens.slice(0, limite);
  const termos = c.split(" ");
  return itens
    .map((item, ordem) => ({ item, ordem, pontos: pontuar(item, c, termos) }))
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.ordem - b.ordem)
    .slice(0, limite)
    .map((r) => r.item);
}
