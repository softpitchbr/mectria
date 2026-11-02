-- Pessoas do time comercial da MecTRIA e o cargo de cada uma.
-- Ninguém é apagado: quem sai fica com ativo = 0.
CREATE TABLE pessoas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL CHECK (cargo IN ('hunter', 'closer', 'diretor', 'projetos')),
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
