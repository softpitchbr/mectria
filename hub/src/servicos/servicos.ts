import { useEffect, useState } from "react";
import { ROTULO_SITUACAO_SERVICO, vendavel, type Servico } from "../../compartilhado/servico";
import { api } from "../api/cliente";

/** Os serviços vêm da API uma vez e ficam guardados para todas as telas (o diretor recarrega depois de salvar). */
let guardados: Servico[] | null = null;
let pedido: Promise<void> | null = null;
// Cada recarga (ou esquecimento) começa uma geração nova: a resposta de uma busca mais antiga é descartada.
let geracao = 0;
const ouvintes = new Set<(s: Servico[]) => void>();

function buscar(): Promise<void> {
  if (pedido) return pedido;
  const minha = geracao;
  pedido = api<Servico[]>("/api/servicos")
    .then((s) => {
      if (minha !== geracao) return;
      guardados = s;
      for (const ouvir of ouvintes) ouvir(s);
    })
    .catch(() => {
      // Sem a lista, os seletores ficam vazios; a próxima tela que pedir tenta de novo.
      if (minha === geracao) pedido = null;
    });
  return pedido;
}

export function useServicos(): Servico[] | null {
  const [servicos, setServicos] = useState(guardados);
  useEffect(() => {
    ouvintes.add(setServicos);
    if (guardados) setServicos(guardados);
    else void buscar();
    return () => {
      ouvintes.delete(setServicos);
    };
  }, []);
  return servicos;
}

/** Busca de novo e avisa todas as telas abertas. */
export async function recarregarServicos(): Promise<void> {
  geracao += 1;
  pedido = null;
  await buscar();
}

/** Só para os testes: cada teste começa sem a lista guardada. */
export function esquecerServicos(): void {
  geracao += 1;
  guardados = null;
  pedido = null;
  ouvintes.clear();
}

/** "" enquanto a lista carrega; o próprio id se o serviço não existe mais. */
export function nomeDoServico(servicos: Servico[] | null, id: string): string {
  if (!servicos) return "";
  return servicos.find((s) => s.id === id)?.nome ?? id;
}

/** O que pode ser escolhido: os vendáveis e, numa proposta antiga, o serviço atual mesmo inativo. */
export function opcoesDeServico(servicos: Servico[] | null, atual?: string): { valor: string; rotulo: string }[] {
  return (servicos ?? [])
    .filter((s) => vendavel(s) || s.id === atual)
    .map((s) => ({
      valor: s.id,
      rotulo: s.situacao === "ativo" ? s.nome : `${s.nome} (${ROTULO_SITUACAO_SERVICO[s.situacao].toLowerCase()})`,
    }));
}
