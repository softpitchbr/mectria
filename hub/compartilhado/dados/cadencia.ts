// Conteúdo migrado de hub-comercial/js/dados/fup.js (versão 0.2), sem mudar o texto.
import type { CodigoToque } from "../cadencia";

/** Toques de follow-up: dias úteis contados da apresentação (D0 = dia da reunião). */
export const CADENCIA: { codigo: CodigoToque; dia: number; canal: string; objetivo: string; modelo: string; dica?: string }[] = [
  {
    "codigo": "D0",
    "dia": 0,
    "canal": "WhatsApp + e-mail",
    "objetivo": "Registrar por escrito o que foi combinado",
    "modelo": "Oi, {contato}! Obrigado pela reunião de hoje.\n\nComo combinamos, o projeto de {servico} é para resolver o que você me contou: {dor}. Segue a proposta em PDF.\n\nFicamos de falar sobre a decisão em {data_decisao}. Qualquer dúvida até lá, é só me chamar aqui.\n\n{vendedor} · MecTRIA"
  },
  {
    "codigo": "D1",
    "dia": 1,
    "canal": "WhatsApp",
    "objetivo": "Destravar a dúvida que surgiu depois",
    "modelo": "Oi, {contato}, tudo bem? Às vezes a dúvida aparece depois da reunião, quando vocês conversam internamente. Surgiu alguma pergunta sobre o projeto que eu possa responder? Se ajudar, explico em 15 minutos para {decisores}."
  },
  {
    "codigo": "D3",
    "dia": 3,
    "canal": "Ligação",
    "objetivo": "Saber em que pé está a decisão",
    "modelo": "Na ligação: \"Oi, {contato}, é o {vendedor}, da MecTRIA. Estou ligando para saber como está a decisão sobre o projeto de {servico}. Ficou alguma dúvida, ou alguma coisa que eu possa ajustar?\"\n\nSe não atender, no WhatsApp: \"Tentei te ligar para saber da proposta. Qual o melhor horário para falarmos 5 minutos?\""
  },
  {
    "codigo": "D5",
    "dia": 5,
    "canal": "WhatsApp",
    "objetivo": "Agregar valor com um conteúdo do mesmo tema",
    "modelo": "Oi, {contato}! Lembrei de vocês: {link_conteudo}. É um projeto parecido com o que conversamos sobre {servico}. Achei que valia mandar.",
    "dica": "Use um post do Instagram ou um caso do mesmo serviço. O Marketing pode transformar negociações reais em posts para isso."
  },
  {
    "codigo": "D8",
    "dia": 8,
    "canal": "Ligação",
    "objetivo": "Perguntar direto o que falta para decidir",
    "modelo": "Na ligação: \"{contato}, quero ser direto para não tomar seu tempo: o que falta para vocês decidirem? É sobre o projeto, o investimento ou o momento?\"\n\nTrate a resposta com o guia de objeções."
  },
  {
    "codigo": "D12",
    "dia": 12,
    "canal": "E-mail",
    "objetivo": "Oferecer um caminho alternativo",
    "modelo": "Assunto: Projeto de {servico}: uma alternativa\n\nOi, {contato},\n\nSe o investimento ou o momento pesaram, dá para começar por uma fase do projeto ou ajustar o escopo. Também consigo reservar a equipe para começar em [data de início] se fecharmos até [data].\n\nQuer que eu prepare essa versão?\n\n{vendedor}\nMecTRIA · Empresa Júnior de Engenharia Mecânica da UFTM",
    "dica": "Downsell por escopo, nunca abaixo do piso. A data de início precisa ser real."
  },
  {
    "codigo": "D15",
    "dia": 15,
    "canal": "WhatsApp",
    "objetivo": "Encerrar com elegância",
    "modelo": "Oi, {contato}. Como não conseguimos nos falar, vou entender que agora não é o momento e paro de te procurar, tudo bem? A proposta vale até {validade}. Se mudar alguma coisa, é só me chamar aqui. Obrigado pela confiança!",
    "dica": "Depois deste toque, registre o resultado: perdida (com o motivo) ou nutrição."
  }
];

export const NUTRICAO: { dias: 45; modelo: string } = {
  "dias": 45,
  "modelo": "Oi, {contato}, tudo bem? Faz um tempo que conversamos sobre {servico}. Como está esse assunto aí? Estamos abrindo agenda para novos projetos em [mês]."
};

export const MOTIVOS_PERDA: readonly string[] = [
  "Preço",
  "Prazo",
  "Escolheu um concorrente",
  "Não é prioridade agora",
  "Sem resposta",
  "Escopo (queria fabricação ou instalação)",
  "Quem decide não aprovou",
  "Fez internamente",
  "Outro"
];

export const REGRAS_FOLLOWUP: readonly string[] = [
  "Todo toque agrega algo ou pede uma decisão. Nunca mande só \"conseguiu ver?\".",
  "No máximo um toque por dia. Ligação vale mais que mensagem.",
  "Toda proposta termina como ganha, perdida (com motivo) ou nutrição. É isso que mede a conversão.",
  "O follow-up é de quem apresentou a proposta.",
  "Se o cliente disser não, agradeça, pergunte o motivo e pare a cadência."
];

/** Rótulo de cada variável dos modelos; o que não tiver valor aparece como [rótulo]. */
export const VARIAVEIS: Record<string, string> = {
  "contato": "nome do contato",
  "servico": "serviço",
  "dor": "dor do cliente",
  "data_decisao": "data da decisão",
  "vendedor": "seu nome",
  "decisores": "quem decide",
  "validade": "validade da proposta",
  "link_conteudo": "link do conteúdo",
  "decisor": "nome do decisor",
  "dor1": "primeira dor",
  "dor2": "segunda dor",
  "objetivo": "objetivo",
  "tentativas": "o que já tentaram",
  "porqueAgora": "por que agora",
  "prazo": "prazo",
  "orcamento": "orçamento",
  "pagamento": "forma de pagamento",
  "concorrencia": "concorrência",
  "criterio": "critério de decisão",
  "prazoDecisao": "prazo da decisão",
  "impacto": "impacto",
  "numeros": "números",
  "ganho": "ganho",
  "dias": "dias",
  "data_proposta": "data da apresentação",
  "empresa": "empresa do cliente",
  "data": "data",
  "anos": "anos de MecTRIA",
  "equipe": "nomes e papéis do time",
  "entregamos": "o que entregamos",
  "fica": "o que fica com o cliente",
  "prazoProjeto": "prazo do projeto",
  "ancora": "quem faria o projeto no mercado",
  "fraseValor": "frase de valor",
  "valor": "valor",
  "parcelas": "parcelas",
  "descontoAVista": "desconto à vista"
};
