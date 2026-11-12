/** Sem sinal da janela da apresentação por mais que isso, o painel oferece reabrir. */
export const JANELA_SUMIU_MS = 5000;

/** Abre (ou traz de volta) a janela da apresentação, com uns 70% da tela, à esquerda. */
export function abrirJanela(reuniaoId: number) {
  const largura = Math.round((window.screen?.availWidth || 1600) * 0.7);
  const altura = window.screen?.availHeight || 900;
  window.open(`/apresentacao/${reuniaoId}`, `hub-apresentacao-${reuniaoId}`, `popup,left=0,top=0,width=${largura},height=${altura}`);
}
