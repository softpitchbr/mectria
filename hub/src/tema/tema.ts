export type EscolhaTema = "sistema" | "escuro" | "claro";

const CHAVE = "hub-tema";
const ESCOLHAS: readonly EscolhaTema[] = ["sistema", "escuro", "claro"];

function armazenamentoPadrao(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function resolverTema(escolha: EscolhaTema, prefereEscuro: boolean): "escuro" | "claro" {
  if (escolha === "sistema") return prefereEscuro ? "escuro" : "claro";
  return escolha;
}

export function lerEscolhaTema(armazenamento: Storage | null = armazenamentoPadrao()): EscolhaTema {
  try {
    const valor = armazenamento?.getItem(CHAVE);
    return ESCOLHAS.includes(valor as EscolhaTema) ? (valor as EscolhaTema) : "sistema";
  } catch {
    return "sistema";
  }
}

export function salvarEscolhaTema(escolha: EscolhaTema, armazenamento: Storage | null = armazenamentoPadrao()): void {
  try {
    armazenamento?.setItem(CHAVE, escolha);
  } catch {
    // Navegador sem armazenamento: o tema vale só nesta aba.
  }
}

export function aplicarTema(escolha: EscolhaTema, raiz: HTMLElement = document.documentElement): void {
  if (escolha === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", escolha === "escuro" ? "dark" : "light");
}
