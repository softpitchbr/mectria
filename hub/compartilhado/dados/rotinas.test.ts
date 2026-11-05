import { BLOCOS_DA_ROTINA } from "./rotinas";

test("as orientações e as tarefas dos blocos usam o texto de docs/17", () => {
  const hunter = Object.fromEntries(BLOCOS_DA_ROTINA.hunter.map((b) => [b.id, b]));
  const closer = Object.fromEntries(BLOCOS_DA_ROTINA.closer.map((b) => [b.id, b]));
  expect(hunter.reagendamentos.orientacao).toBe("Depois, quem não compareceu à diagnóstica (no-show), para marcar de novo.");
  expect(hunter["cold-call"].orientacao).toContain("a ligação em que o hunter fala com quem decide");
  expect(hunter.confirmacoes.orientacao).toBe("Três mensagens pelo WhatsApp, no dia da reunião. Só sai a seguinte se a anterior ficou sem resposta.");
  expect(closer.fechamento.fixos[0].titulo).toBe("Abrir o Follow-up pela manhã e fazer o FUP de todos os leads em negociação");
  expect(closer.ap.orientacao).toBe(
    "Não deixar lead parado muito tempo nesta etapa. Quando estiver muito difícil marcar e a proposta estiver empacando, gravar um vídeo com a proposta personalizada e enviar.",
  );
  expect(closer.construcao.orientacao).toBe("Mandar o briefing para Projetos no mesmo dia. Nenhum lead fica mais de 3 dias nesta etapa.");
  expect(closer.reativacao.orientacao).toBe("A reativação é simples e constante. Sem aderência, o closer encerra sem gastar energia.");
});
