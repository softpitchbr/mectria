export class ErroApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    public mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

/** Chama a API do hub. Em 403 sem_acesso, avisa a janela com o evento hub:sem-acesso. */
export async function api<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      ...init,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ErroApi(0, "rede", "Não foi possível falar com o hub. Confira a internet ou recarregue a página.");
  }

  let corpo: unknown = null;
  try {
    corpo = await resposta.json();
  } catch {
    corpo = null;
  }

  if (!resposta.ok) {
    const { erro, mensagem } = (corpo ?? {}) as { erro?: string; mensagem?: string };
    const codigo = erro ?? "desconhecido";
    if (resposta.status === 403 && codigo === "sem_acesso") window.dispatchEvent(new Event("hub:sem-acesso"));
    throw new ErroApi(resposta.status, codigo, mensagem ?? "Algo deu errado. Tente de novo.");
  }
  return corpo as T;
}
