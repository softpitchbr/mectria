-- Fase 3: a ficha da diagnóstica (uma resposta por pergunta), as anotações livres
-- e as pendências técnicas para Projetos. A reunião ganha o fechamento.

ALTER TABLE reunioes ADD COLUMN quem_decide TEXT;
ALTER TABLE reunioes ADD COLUMN iniciada_em TEXT;
ALTER TABLE reunioes ADD COLUMN encerrada_em TEXT;
ALTER TABLE reunioes ADD COLUMN resultado TEXT CHECK (resultado IN ('proposta_marcada', 'nao_qualificou'));
ALTER TABLE reunioes ADD COLUMN motivo TEXT;
ALTER TABLE reunioes ADD COLUMN briefing_enviado_em TEXT;

CREATE TABLE fichas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reuniao_id INTEGER NOT NULL REFERENCES reunioes(id),
  pergunta_id TEXT NOT NULL,
  resposta TEXT NOT NULL DEFAULT '',
  autor_id INTEGER REFERENCES pessoas(id),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (reuniao_id, pergunta_id)
);

CREATE TABLE anotacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reuniao_id INTEGER NOT NULL REFERENCES reunioes(id),
  id_cliente TEXT NOT NULL UNIQUE,
  minuto INTEGER NOT NULL DEFAULT 0,
  passo TEXT NOT NULL DEFAULT '',
  marcacao TEXT CHECK (marcacao IN ('objecao', 'tecnico', 'escopo', 'proximo_passo')),
  texto TEXT NOT NULL,
  autor_id INTEGER REFERENCES pessoas(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX anotacoes_reuniao ON anotacoes (reuniao_id);

CREATE TABLE pendencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anotacao_id INTEGER REFERENCES anotacoes(id),
  oportunidade_id INTEGER NOT NULL REFERENCES oportunidades(id),
  texto TEXT NOT NULL,
  prazo TEXT NOT NULL,
  responsavel_id INTEGER REFERENCES pessoas(id),
  situacao TEXT NOT NULL DEFAULT 'aberta' CHECK (situacao IN ('aberta', 'respondida', 'fechada')),
  resposta TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX pendencias_oportunidade ON pendencias (oportunidade_id);
