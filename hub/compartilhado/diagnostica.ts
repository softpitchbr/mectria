import { preencherModelo } from "./cadencia";
import { formatarDia } from "./datas";
import { DIAGNOSTICA, type Pergunta } from "./dados/diagnostica";

export type Marcacao = "objecao" | "tecnico" | "escopo" | "proximo_passo";

export const ROTULO_MARCACAO: Record<Marcacao, string> = {
  objecao: "Objeção",
  tecnico: "Técnico",
  escopo: "Escopo",
  proximo_passo: "Próximo passo",
};

export interface Anotacao {
  /** Gerado no navegador: a mesma anotação mandada duas vezes não duplica. */
  idCliente: string;
  minuto: number;
  passo: string;
  marcacao: Marcacao | null;
  texto: string;
  criadoEm?: string;
}

/** Respostas da ficha, por id de pergunta. */
export type Respostas = Record<string, string>;

export interface Passo {
  id: string;
  grupo: "abertura" | "bloco" | "tecnica" | "escopo" | "fechamento";
  letra?: string;
  titulo: string;
  pergunta?: Pergunta;
  fala?: string;
  dica?: string;
}

const TITULO_TECNICO: Record<string, string> = { escopo: "Escopo do serviço", parametros: "Parâmetros técnicos" };

/** O roteiro da diagnóstica: abertura, GPCTBA + C&I, técnicas do serviço, escopo geral e fechamento. */
export function roteiroDaDiagnostica(perguntasDoServico: Pergunta[]): Passo[] {
  const passos: Passo[] = DIAGNOSTICA.abertura.map((a, i) => ({
    id: `abertura-${i + 1}`,
    grupo: "abertura",
    titulo: a.titulo,
    fala: a.fala,
    dica: a.dica,
  }));
  for (const bloco of DIAGNOSTICA.blocos) {
    for (const pergunta of bloco.perguntas) {
      passos.push({ id: pergunta.id, grupo: "bloco", letra: bloco.letra, titulo: bloco.titulo, pergunta, dica: pergunta.dica });
    }
  }
  for (const pergunta of perguntasDoServico) {
    passos.push({
      id: pergunta.id,
      grupo: "tecnica",
      titulo: TITULO_TECNICO[pergunta.bloco ?? ""] ?? "Técnico",
      pergunta,
      dica: pergunta.dica,
    });
  }
  for (const pergunta of DIAGNOSTICA.escopoGeral) {
    passos.push({ id: pergunta.id, grupo: "escopo", titulo: "Escopo geral", pergunta, dica: pergunta.dica });
  }
  passos.push({ id: "fechamento", grupo: "fechamento", titulo: "Fechamento", fala: DIAGNOSTICA.fechamento.pacto, dica: DIAGNOSTICA.fechamento.pactoDica });
  return passos;
}

/** As perguntas com chave são as da base (as técnicas do serviço não entram nos modelos). */
const TODAS_AS_PERGUNTAS: Pergunta[] = [...DIAGNOSTICA.blocos.flatMap((b) => b.perguntas), ...DIAGNOSTICA.escopoGeral];

/** Troca o id da pergunta pela chave usada nos modelos (c-dor → dor). */
export function valoresDasRespostas(respostas: Respostas): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const p of TODAS_AS_PERGUNTAS) {
    if (p.chave && respostas[p.id]?.trim()) valores[p.chave] = respostas[p.id].trim();
  }
  return valores;
}

/** "Deixa eu ver se entendi…", preenchido com as respostas. */
export function resumoDoFechamento(respostas: Respostas, contato: string): string {
  return preencherModelo(DIAGNOSTICA.fechamento.resumo, { ...valoresDasRespostas(respostas), contato });
}

/** O resumo que vai para o cliente no mesmo dia (com a data da proposta e o nome de quem vende, quando o hub sabe). */
export function resumoParaCliente(respostas: Respostas, contato: string, extra: { dataProposta?: string; vendedor?: string } = {}): string {
  return preencherModelo(DIAGNOSTICA.resumoCliente, {
    ...valoresDasRespostas(respostas),
    contato,
    data_proposta: extra.dataProposta,
    vendedor: extra.vendedor,
  });
}

export interface SecaoBriefing {
  titulo: string;
  itens: { pergunta: string; resposta: string }[];
}

const respondidas = (perguntas: Pergunta[], respostas: Respostas) =>
  perguntas.filter((p) => respostas[p.id]?.trim()).map((p) => ({ pergunta: p.texto, resposta: respostas[p.id].trim() }));

/** O briefing para Projetos: as respostas por seção e as anotações técnicas. Seção vazia fica de fora. */
export function briefingDaFicha(ficha: { respostas: Respostas; anotacoes: Anotacao[]; perguntasDoServico: Pergunta[] }): SecaoBriefing[] {
  const { respostas } = ficha;
  const doTipo = (tipo: "contexto" | "comercial" | "decisao") =>
    DIAGNOSTICA.blocos.filter((b) => b.briefing === tipo).flatMap((b) => b.perguntas);
  const secoes: SecaoBriefing[] = [
    { titulo: "Contexto", itens: respondidas(doTipo("contexto"), respostas) },
    { titulo: "Comercial", itens: respondidas(doTipo("comercial"), respostas) },
    { titulo: "Decisão", itens: respondidas(doTipo("decisao"), respostas) },
    { titulo: "Técnico do serviço", itens: respondidas(ficha.perguntasDoServico, respostas) },
    { titulo: "Escopo", itens: respondidas(DIAGNOSTICA.escopoGeral, respostas) },
    {
      titulo: "Anotações técnicas",
      itens: ficha.anotacoes
        .filter((a) => a.marcacao === "tecnico")
        .sort((a, b) => a.minuto - b.minuto)
        .map((a) => ({ pergunta: `Minuto ${a.minuto}`, resposta: a.texto })),
    },
  ];
  return secoes.filter((s) => s.itens.length > 0);
}

// Fase 9: a apresentação da diagnóstica acompanha o roteiro ----------------------------

/** Os slides da apresentação da diagnóstica, na ordem (hub/apresentacoes/fonte/diagnostica.html). */
export const SLIDES_DA_DIAGNOSTICA = ["agenda", "quem-somos", "escuta", "como-trabalhamos", "proximo-passo"] as const;

/** O slide que o cliente vê em cada passo: a apresentação segue o roteiro sozinha, sem setas próprias. */
export function slideDoPasso(passo: Pick<Passo, "id" | "grupo">): number {
  if (passo.grupo === "abertura") return passo.id === "abertura-1" ? 0 : 1;
  if (passo.grupo === "bloco" || passo.grupo === "tecnica") return 2;
  if (passo.grupo === "escopo") return 3;
  return 4;
}

const ETAPA_TECNICA = "Técnico";

/** O que vai para a apresentação da diagnóstica: o cliente, a data, o serviço e a etapa atual da conversa. */
export function dadosDaDiagnostica(
  ficha: {
    reuniao: { dataHora: string };
    oportunidade: { empresa: string; contato: string };
    servicoNome?: string;
    perguntasDoServico: (Pergunta & { inativa?: boolean })[];
  },
  passo: Pick<Passo, "grupo" | "titulo">,
): Record<string, string> {
  const temTecnicas = ficha.perguntasDoServico.some((p) => !p.inativa);
  const etapas = [...DIAGNOSTICA.blocos.map((b) => b.titulo), ...(temTecnicas ? [ETAPA_TECNICA] : [])];
  return {
    empresa: ficha.oportunidade.empresa,
    contato: ficha.oportunidade.contato.trim().split(/\s+/)[0] ?? "",
    data: formatarDia(ficha.reuniao.dataHora.slice(0, 10)),
    servico: ficha.servicoNome ?? "",
    etapas: etapas.join("\n"),
    etapa: passo.grupo === "bloco" ? passo.titulo : passo.grupo === "tecnica" ? ETAPA_TECNICA : "",
  };
}
