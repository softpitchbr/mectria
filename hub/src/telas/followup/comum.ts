import { ErroApi } from "../../api/cliente";

export const mensagemDe = (e: unknown) => (e instanceof ErroApi ? e.mensagem : "Algo deu errado. Tente de novo.");
