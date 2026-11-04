-- Fase 7: a ligação registra a conexão (falou com quem decide); a diagnóstica marcada ganha observações e a confirmação.
CREATE TABLE ligacoes_nova (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id),
  dia TEXT NOT NULL,
  resultado TEXT NOT NULL CHECK (resultado IN ('nao_atendeu', 'atendeu', 'conexao', 'marcou')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO ligacoes_nova (id, pessoa_id, dia, resultado, criado_em) SELECT id, pessoa_id, dia, resultado, criado_em FROM ligacoes;
DROP TABLE ligacoes;
ALTER TABLE ligacoes_nova RENAME TO ligacoes;
CREATE INDEX ligacoes_pessoa_dia ON ligacoes (pessoa_id, dia);

ALTER TABLE reunioes ADD COLUMN observacoes TEXT;
ALTER TABLE reunioes ADD COLUMN fups_confirmacao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reunioes ADD COLUMN confirmada_em TEXT;
