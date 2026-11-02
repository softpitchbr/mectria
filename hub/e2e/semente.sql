-- Pessoas fictícias para o teste ponta a ponta e para usar o hub localmente.
-- Nenhum destes e-mails é de membro real da MecTRIA.
DELETE FROM pessoas;
INSERT INTO pessoas (nome, email, cargo, ativo) VALUES
  ('Diana Diretora', 'dir@mectria.com', 'diretor', 1),
  ('Carlos Closer', 'clo@mectria.com', 'closer', 1),
  ('Helena Hunter', 'hun@mectria.com', 'hunter', 1),
  ('Paulo Projetos', 'pro@mectria.com', 'projetos', 1),
  ('Ex Integrante', 'ex@mectria.com', 'closer', 0);
