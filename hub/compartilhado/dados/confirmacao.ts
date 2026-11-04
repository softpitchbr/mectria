// Confirmação da diagnóstica e mensagens dos grupos, de docs/17-processo-comercial.md, seção 3 (Lucas, 04/11/2026), sem mudar o texto.
// As duas mensagens de grupo são rascunho e vão para o Comercial & Projetos (a confirmar na reunião de 10/11).

/** Três mensagens no dia da reunião; só sai a seguinte se a anterior ficou sem resposta. */
export const FUPS_CONFIRMACAO: { numero: 1 | 2 | 3; quando: string; modelo: string }[] = [
  {
    numero: 1,
    quando: "Ao começar o dia da reunião",
    modelo:
      "Opa! Tudo bem? Sou o {hunter}, da MecTRIA. Muito prazer! Estou passando para confirmar nossa reunião agendada para {data}, às {hora}. Achei importante confirmar antes porque a agenda está bem movimentada, com algumas reuniões em sequência, então é importante pegar contigo essa confirmação para aproveitarmos a agenda. Tudo confirmado?",
  },
  { numero: 2, quando: "2 horas antes, se não respondeu", modelo: "Oi! Acabei não pegando essa confirmação contigo, está tudo certo?" },
  { numero: 3, quando: "30 minutos antes, se ainda não respondeu", modelo: "Está por aí? 🙏" },
];

/** O grupo onde o hunter pergunta pelo projetista e avisa a confirmação (resposta de um hunter, 04/11/2026). */
export const GRUPO_CONFIRMACAO = "Comercial & Projetos";

/** Ao marcar, o hunter pergunta no grupo se algum projetista pode no horário. */
export const MENSAGEM_GRUPO_MARCADA = "Diagnóstica marcada: {empresa}, {data} às {hora}, {formato}. Algum projetista pode nesse horário?";

/** Quando o lead confirma, o hunter avisa no grupo. */
export const MENSAGEM_GRUPO_CONFIRMADA = "Reunião confirmada: {empresa} ({contato}), {data} às {hora}, {formato}, com {projetista}.";
