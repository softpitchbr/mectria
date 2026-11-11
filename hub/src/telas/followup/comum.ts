import { servicosDaCarta } from "../../../compartilhado/dados/servicos-completos";

// Provisório (Task 5 da fase 8): a Task 6 troca pela lista da API.
const SERVICOS = servicosDaCarta();
import { ErroApi } from "../../api/cliente";

export const nomeDoServico = (id: string) => SERVICOS.find((s) => s.id === id)?.nome ?? id;

export const mensagemDe = (e: unknown) => (e instanceof ErroApi ? e.mensagem : "Algo deu errado. Tente de novo.");

export const OPCOES_SERVICO = SERVICOS.map((s) => ({ valor: s.id, rotulo: s.nome }));
