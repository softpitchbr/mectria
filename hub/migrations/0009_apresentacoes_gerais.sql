-- Fase 9: apresentações gerais, iguais para todos (por enquanto, só a da diagnóstica).
-- O HTML fica no Workers KV (chave geral/{id}/{versao}); aqui ficam o arquivo e a versão, como em servicos.
CREATE TABLE apresentacoes_gerais (
  id TEXT PRIMARY KEY CHECK (id IN ('diagnostica')),
  -- JSON (ArquivoDaApresentacao); NULL = não enviada (a diagnóstica fica sem janela).
  apresentacao TEXT,
  apresentacao_versao INTEGER NOT NULL DEFAULT 0,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_por TEXT
);

INSERT INTO apresentacoes_gerais (id) VALUES ('diagnostica');
