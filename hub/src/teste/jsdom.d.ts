// Só o que o teste da apresentação de exemplo usa do JSDOM (o pacote não traz os tipos).
declare module "jsdom" {
  export class JSDOM {
    constructor(html: string, opcoes?: { runScripts?: "dangerously"; url?: string; pretendToBeVisual?: boolean });
    window: Window & typeof globalThis;
  }
}
