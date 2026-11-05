-- Fase 2: oportunidades, reuniões (só agenda), propostas, toques de follow-up,
-- rotina do dia, ligações do hunter e histórico de situação.
-- Nada é apagado: oportunidade e proposta encerram por situação.

CREATE TABLE oportunidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa TEXT NOT NULL,
  contato TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  cidade TEXT NOT NULL DEFAULT '',
  segmento TEXT NOT NULL DEFAULT '',
  origem TEXT NOT NULL DEFAULT '',
  servico TEXT NOT NULL,
  hunter_id INTEGER REFERENCES pessoas(id),
  closer_id INTEGER REFERENCES pessoas(id),
  situacao TEXT NOT NULL CHECK (situacao IN ('diagnostica_marcada', 'proposta_marcada', 'em_followup', 'ganha', 'perdida', 'nutricao')),
  motivo_perda TEXT,
  valor_fechado INTEGER,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX oportunidades_closer ON oportunidades (closer_id);
CREATE INDEX oportunidades_hunter ON oportunidades (hunter_id);

CREATE TABLE reunioes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oportunidade_id INTEGER NOT NULL REFERENCES oportunidades(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('diagnostica', 'proposta')),
  data_hora TEXT NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('online', 'presencial')),
  situacao TEXT NOT NULL DEFAULT 'marcada' CHECK (situacao IN ('marcada', 'em_andamento', 'concluida', 'cancelada')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX reunioes_data_hora ON reunioes (data_hora);

CREATE TABLE propostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oportunidade_id INTEGER NOT NULL REFERENCES oportunidades(id),
  servico TEXT NOT NULL,
  valor INTEGER NOT NULL,
  apresentada_em TEXT NOT NULL,
  data_decisao TEXT,
  quem_decide TEXT NOT NULL DEFAULT '',
  dor TEXT NOT NULL DEFAULT '',
  validade TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX propostas_oportunidade ON propostas (oportunidade_id);

CREATE TABLE toques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposta_id INTEGER NOT NULL REFERENCES propostas(id),
  codigo TEXT NOT NULL,
  previsto_para TEXT NOT NULL,
  feito_em TEXT,
  canal TEXT,
  resultado TEXT,
  autor_id INTEGER REFERENCES pessoas(id),
  UNIQUE (proposta_id, codigo)
);
CREATE INDEX toques_previsto ON toques (previsto_para);

CREATE TABLE rotinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id),
  dia TEXT NOT NULL,
  chave TEXT NOT NULL,
  titulo TEXT NOT NULL,
  origem TEXT NOT NULL CHECK (origem IN ('fixo', 'gerado')),
  feito_em TEXT,
  UNIQUE (pessoa_id, dia, chave)
);

CREATE TABLE ligacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id),
  dia TEXT NOT NULL,
  resultado TEXT NOT NULL CHECK (resultado IN ('nao_atendeu', 'atendeu', 'marcou')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX ligacoes_pessoa_dia ON ligacoes (pessoa_id, dia);

CREATE TABLE historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oportunidade_id INTEGER NOT NULL REFERENCES oportunidades(id),
  de TEXT,
  para TEXT NOT NULL,
  detalhe TEXT,
  autor_id INTEGER REFERENCES pessoas(id),
  em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX historico_oportunidade ON historico (oportunidade_id);
