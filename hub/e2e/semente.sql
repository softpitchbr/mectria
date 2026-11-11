-- Pessoas e dados fictícios para o teste ponta a ponta e para usar o hub localmente.
-- Nenhum destes e-mails é de membro real da MecTRIA.
DELETE FROM pendencias;
DELETE FROM anotacoes;
DELETE FROM fichas;
DELETE FROM historico;
DELETE FROM toques;
DELETE FROM propostas;
DELETE FROM reunioes;
DELETE FROM oportunidades;
DELETE FROM rotinas;
DELETE FROM ligacoes;
DELETE FROM pessoas;

INSERT INTO pessoas (nome, email, cargo, ativo) VALUES
  ('Diana Diretora', 'dir@mectria.com', 'diretor', 1),
  ('Carlos Closer', 'clo@mectria.com', 'closer', 1),
  ('Helena Hunter', 'hun@mectria.com', 'hunter', 1),
  ('Paulo Projetos', 'pro@mectria.com', 'projetos', 1),
  ('Ex Integrante', 'ex@mectria.com', 'closer', 0);

-- Fase 2: uma proposta do Carlos apresentada há 20 dias, sem nenhum toque feito (atrasada).
INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
VALUES ('Fundição Atrasada', 'Rui', '34999990001', 'registro manual', 'climatizacao',
        (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'em_followup');

INSERT INTO propostas (oportunidade_id, servico, valor, apresentada_em, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Fundição Atrasada'), 'climatizacao', 1500000, date('now', '-20 days'), 'Rui (dono)');

INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D0', date('now', '-20 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D1', date('now', '-19 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D3', date('now', '-17 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D5', date('now', '-15 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D8', date('now', '-11 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D12', date('now', '-6 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D15', date('now', '-2 days') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Fundição Atrasada';

INSERT INTO historico (oportunidade_id, de, para, detalhe)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Fundição Atrasada'), NULL, 'em_followup', 'semente do teste');

-- Fase 3: duas diagnósticas do Carlos marcadas para hoje (hora de São Paulo), pela Helena.
INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, hunter_id, closer_id, situacao)
VALUES ('Torno Hoje', 'Bia', '34999990002', 'cold call', 'climatizacao',
        (SELECT id FROM pessoas WHERE email = 'hun@mectria.com'), (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'diagnostica_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Torno Hoje'), 'diagnostica', date('now', '-3 hours') || 'T23:00', 'online');

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, hunter_id, closer_id, situacao)
VALUES ('Prensa Fria', 'Caio', '34999990003', 'cold call', 'nr-12',
        (SELECT id FROM pessoas WHERE email = 'hun@mectria.com'), (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'diagnostica_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Prensa Fria'), 'diagnostica', date('now', '-3 hours') || 'T23:30', 'online');

-- Fase 4: duas propostas do Carlos marcadas para hoje (hora de São Paulo), cada uma com a diagnóstica
-- concluída (a dor do cliente vem da ficha) e quem decide "Bia".
INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
VALUES ('Caldeiraria Sul', 'Ana', '34999990004', 'cold call', 'climatizacao', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'proposta_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, situacao, resultado, quem_decide, encerrada_em)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Caldeiraria Sul'), 'diagnostica', date('now', '-3 hours', '-5 days') || 'T10:00', 'online', 'concluida', 'proposta_marcada', 'Bia', datetime('now', '-5 days'));
INSERT INTO fichas (reuniao_id, pergunta_id, resposta)
VALUES ((SELECT r.id FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id WHERE o.empresa = 'Caldeiraria Sul' AND r.tipo = 'diagnostica'), 'c-dor', 'O galpão passa de 38 °C à tarde');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Caldeiraria Sul'), 'proposta', date('now', '-3 hours') || 'T23:40', 'online', 'Bia');

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
VALUES ('Estrutura Leste', 'Bia', '34999990005', 'cold call', 'estruturas-metalicas', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'proposta_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Estrutura Leste'), 'proposta', date('now', '-3 hours') || 'T23:50', 'online', 'Bia');

-- Fase 6: uma oportunidade em nutrição cujo mês de retomar já chegou, uma proposta em follow-up com uma
-- dúvida técnica aberta para Projetos, uma ganha no mês e uma diagnóstica de hoje marcada pela Helena.
INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao, retomar_em)
VALUES ('Forja Nutrida', 'Davi', '34999990006', 'cold call', 'climatizacao', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'nutricao', date('now', '-3 hours', '-1 day'));
INSERT INTO propostas (oportunidade_id, servico, valor, apresentada_em, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Forja Nutrida'), 'climatizacao', 1800000, date('now', '-3 hours', '-75 days'), 'Davi');
INSERT INTO historico (oportunidade_id, de, para, detalhe)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Forja Nutrida'), 'em_followup', 'nutricao', 'semente do teste');

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
VALUES ('Usinagem Pendente', 'Eva', '34999990007', 'cold call', 'climatizacao', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'em_followup');
INSERT INTO propostas (oportunidade_id, servico, valor, apresentada_em, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Usinagem Pendente'), 'climatizacao', 1200000, date('now', '-3 hours'), 'Eva');
INSERT INTO toques (proposta_id, codigo, previsto_para) SELECT p.id, 'D0', date('now', '-3 hours') FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id WHERE o.empresa = 'Usinagem Pendente';
INSERT INTO pendencias (oportunidade_id, texto, prazo)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Usinagem Pendente'), 'Qual a vazão necessária no galpão?', date('now', '-3 hours'));

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao, valor_fechado)
VALUES ('Bomba Ganha', 'Fábio', '34999990008', 'cold call', 'climatizacao', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'ganha', 900000);
INSERT INTO propostas (oportunidade_id, servico, valor, apresentada_em, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Bomba Ganha'), 'climatizacao', 1000000, date('now', '-3 hours'), 'Fábio');
INSERT INTO historico (oportunidade_id, de, para, detalhe)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Bomba Ganha'), 'em_followup', 'ganha', 'semente do teste');

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, hunter_id, closer_id, situacao)
VALUES ('Solda Hunter', 'Gil', '34999990009', 'cold call', 'climatizacao',
        (SELECT id FROM pessoas WHERE email = 'hun@mectria.com'), (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'diagnostica_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Solda Hunter'), 'diagnostica', date('now', '-3 hours') || 'T23:20', 'online');

-- Fase 7: uma diagnóstica de hoje da Helena para confirmar, um no-show da Helena para reagendar e uma proposta do Carlos
-- em construção há 4 dias (reunião de proposta daqui a 5 dias, sem valor preparado).
INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, hunter_id, closer_id, situacao)
VALUES ('Caldeira Confirma', 'Iara', '34999990010', 'cold call', 'climatizacao',
        (SELECT id FROM pessoas WHERE email = 'hun@mectria.com'), (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'diagnostica_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, observacoes)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Caldeira Confirma'), 'diagnostica', date('now', '-3 hours') || 'T23:10', 'online', 'O sócio decide; prefere WhatsApp.');

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, hunter_id, closer_id, situacao)
VALUES ('Usina Faltosa', 'João', '34999990011', 'cold call', 'climatizacao',
        (SELECT id FROM pessoas WHERE email = 'hun@mectria.com'), (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'diagnostica_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, situacao, motivo, encerrada_em)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Usina Faltosa'), 'diagnostica', date('now', '-3 hours', '-1 day') || 'T10:00', 'online', 'cancelada', 'Cliente não compareceu', datetime('now', '-1 day'));

INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
VALUES ('Molde Atrasado', 'Lia', '34999990012', 'cold call', 'climatizacao', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'proposta_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, quem_decide)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Molde Atrasado'), 'proposta', date('now', '-3 hours', '+5 days') || 'T15:00', 'online', 'Lia');
INSERT INTO historico (oportunidade_id, de, para, detalhe, em)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Molde Atrasado'), 'diagnostica_marcada', 'proposta_marcada', 'semente do teste', datetime('now', '-4 days'));

-- Roteiro da demo (docs/18): o briefing da diagnóstica da Caldeiraria Sul já foi para Projetos, para aparecer em Briefings.
UPDATE reunioes SET briefing_enviado_em = datetime('now', '-4 days')
WHERE tipo = 'diagnostica' AND oportunidade_id = (SELECT id FROM oportunidades WHERE empresa = 'Caldeiraria Sul');

-- Fase 8: os serviços voltam ao que a migração 0008 cadastrou (sem os criados no teste, sem apresentação
-- própria nem roteiro). "Prensa Nova" (Desenvolvimento de Produto) tem a proposta de hoje com o Carlos,
-- já preparada, para a reunião com a apresentação em HTML.
DELETE FROM servicos WHERE ordem > 12;
UPDATE servicos SET apresentacao = NULL, roteiro = NULL, apresentacao_versao = 0;
INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
VALUES ('Prensa Nova', 'Rui', '34999990020', 'cold call', 'desenvolvimento-de-produto', (SELECT id FROM pessoas WHERE email = 'clo@mectria.com'), 'proposta_marcada');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, situacao, resultado, quem_decide, encerrada_em)
VALUES ((SELECT id FROM oportunidades WHERE empresa = 'Prensa Nova'), 'diagnostica', date('now', '-3 hours', '-4 days') || 'T10:00', 'online', 'concluida', 'proposta_marcada', 'Rui', datetime('now', '-4 days'));
INSERT INTO fichas (reuniao_id, pergunta_id, resposta)
VALUES ((SELECT r.id FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id WHERE o.empresa = 'Prensa Nova' AND r.tipo = 'diagnostica'), 'c-dor', 'A prensa manual trava duas vezes por semana');
INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, quem_decide, variaveis)
VALUES (
  (SELECT id FROM oportunidades WHERE empresa = 'Prensa Nova'), 'proposta', date('now', '-3 hours') || 'T23:50', 'online', 'Rui',
  '{"servico":"desenvolvimento-de-produto","escopo":"Modelagem CAD 3D\nDesenhos 2D para fabricação","ficaComCliente":"Fabricação e montagem física","valor":2400000,"parcelas":6,"prazo":"60 dias","condicoes":"","equipe":"Rui e Bia"}'
);
