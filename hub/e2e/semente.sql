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
