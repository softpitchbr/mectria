// Cadência de 7 dias, de docs/16-pitch-e-fups.md (decidida pelo Lucas em 04/11/2026), sem mudar o texto.
// Os toques D3 a D15 da versão 0.2 (hub-comercial/js/dados/fup.js) continuam para as propostas já registradas.
import type { CodigoToque } from "../cadencia";

export type DadosDoToque = { codigo: CodigoToque; canal: string; objetivo: string; modelo: string; dica?: string };

/** Toques da janela de 7 dias; as datas saem das regras em compartilhado/cadencia.ts. */
export const CADENCIA: DadosDoToque[] = [
  {
    "codigo": "D0",
    "canal": "WhatsApp",
    "objetivo": "Registrar o combinado e a data da resposta",
    "modelo": "Fala, {contato}, tudo bem? Obrigado pela reunião de hoje!\n\nComo combinamos, segue a proposta do projeto de {servico}, pensado para resolver o que você me contou: {dor}.\n\nComo te expliquei na jornada de parcerias, combinamos o sim ou não até {data_decisao}, para eu organizar a capacidade do time. Qualquer dúvida até lá, me chama por aqui.\n\n{vendedor}, da MecTRIA"
  },
  {
    "codigo": "D1",
    "canal": "WhatsApp",
    "objetivo": "Destravar a dúvida que aparece depois e trazer quem decide",
    "modelo": "Fala, {contato}! Às vezes a dúvida aparece depois da reunião, quando vocês conversam internamente. Surgiu alguma pergunta sobre o projeto? Se ajudar, explico em 15 minutos para {decisores}."
  },
  {
    "codigo": "LIGACAO",
    "canal": "Ligação",
    "objetivo": "Perguntar direto o que falta",
    "modelo": "Na ligação: \"{contato}, é o {vendedor}, da MecTRIA. Quero ser direto para não tomar seu tempo: o que falta para vocês decidirem? É sobre o projeto, o investimento ou o momento?\"\n\nSe não atender, no WhatsApp: \"Tentei te ligar agora há pouco. Consegue 5 minutos hoje ou amanhã?\""
  },
  {
    "codigo": "SEXTA",
    "canal": "WhatsApp",
    "objetivo": "Usar o ciclo de segunda para pedir o próximo passo",
    "modelo": "Fala, {contato}, tudo bem? Senti uma sinergia bacana na nossa reunião e por isso vim te mandar essa mensagem.\n\nPensando na organização das equipes de projetos: toda segunda-feira começa um ciclo de novos projetos de parceria, e neste fim de semana vou me reunir com o time de Projetos para deixar as equipes pré-alocadas.\n\nEntão queria entender: o que ainda precisamos alinhar para avançarmos?"
  },
  {
    "codigo": "D7",
    "canal": "WhatsApp",
    "objetivo": "Pedir o sim ou não combinado, sem pressão",
    "modelo": "Fala, {contato}, tudo bem? Hoje é o dia que combinamos para o sim ou não da parceria. Se fizer sentido seguir, me dá um ok por aqui que eu já coloco vocês no próximo ciclo de projetos. Se agora não for o momento, sem problema, é só me falar: assim eu libero a vaga para outro parceiro.",
    "dica": "Sem resposta depois do D7, registre o resultado: perdida (com o motivo) ou nutrição."
  }
];

/** Mensagem do D7 quando a reunião foi numa sexta: a sexta seguinte é o próprio D7. */
export const D7_NA_SEXTA = "Fala, {contato}, tudo bem? Hoje é o dia que combinamos para o sim ou não da parceria, e na segunda começa o próximo ciclo de projetos. Vou me reunir com o time de Projetos neste fim de semana para pré-alocar as equipes. O que ainda precisamos alinhar para vocês entrarem nesse ciclo?";

/** Toques da cadência de 15 dias da versão 0.2, para as propostas registradas antes da troca. */
export const TOQUES_ANTIGOS: DadosDoToque[] = [
  {
    "codigo": "D3",
    "canal": "Ligação",
    "objetivo": "Saber em que pé está a decisão",
    "modelo": "Na ligação: \"Oi, {contato}, é o {vendedor}, da MecTRIA. Estou ligando para saber como está a decisão sobre o projeto de {servico}. Ficou alguma dúvida, ou alguma coisa que eu possa ajustar?\"\n\nSe não atender, no WhatsApp: \"Tentei te ligar para saber da proposta. Qual o melhor horário para falarmos 5 minutos?\""
  },
  {
    "codigo": "D5",
    "canal": "WhatsApp",
    "objetivo": "Agregar valor com um conteúdo do mesmo tema",
    "modelo": "Oi, {contato}! Lembrei de vocês: {link_conteudo}. É um projeto parecido com o que conversamos sobre {servico}. Achei que valia mandar.",
    "dica": "Use um post do Instagram ou um caso do mesmo serviço. O Marketing pode transformar negociações reais em posts para isso."
  },
  {
    "codigo": "D8",
    "canal": "Ligação",
    "objetivo": "Perguntar direto o que falta para decidir",
    "modelo": "Na ligação: \"{contato}, quero ser direto para não tomar seu tempo: o que falta para vocês decidirem? É sobre o projeto, o investimento ou o momento?\"\n\nTrate a resposta com o guia de objeções."
  },
  {
    "codigo": "D12",
    "canal": "E-mail",
    "objetivo": "Oferecer um caminho alternativo",
    "modelo": "Assunto: Projeto de {servico}: uma alternativa\n\nOi, {contato},\n\nSe o investimento ou o momento pesaram, dá para começar por uma fase do projeto ou ajustar o escopo. Também consigo reservar a equipe para começar em [data de início] se fecharmos até [data].\n\nQuer que eu prepare essa versão?\n\n{vendedor}\nMecTRIA · Empresa Júnior de Engenharia Mecânica da UFTM",
    "dica": "Downsell por escopo, nunca abaixo do piso. A data de início precisa ser real."
  },
  {
    "codigo": "D15",
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
