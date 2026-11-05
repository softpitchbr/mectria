-- Fase 4: a reunião de proposta guarda a preparação (variáveis da apresentação), o andamento
-- (quem está na sala, pactos, tempo de cada slide e o slide atual) e o desfecho. A proposta
-- registrada no fechamento aponta para a reunião e copia as variáveis.

ALTER TABLE reunioes ADD COLUMN variaveis TEXT;
ALTER TABLE reunioes ADD COLUMN sala TEXT;
ALTER TABLE reunioes ADD COLUMN pactos TEXT;
ALTER TABLE reunioes ADD COLUMN tempos TEXT;
ALTER TABLE reunioes ADD COLUMN slide_atual INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reunioes ADD COLUMN resultado_proposta TEXT CHECK (resultado_proposta IN ('ganho', 'decidir', 'ajuste', 'perdido'));

ALTER TABLE propostas ADD COLUMN reuniao_id INTEGER REFERENCES reunioes(id);
ALTER TABLE propostas ADD COLUMN escopo TEXT NOT NULL DEFAULT '';
ALTER TABLE propostas ADD COLUMN fica_com_cliente TEXT NOT NULL DEFAULT '';
ALTER TABLE propostas ADD COLUMN prazo TEXT NOT NULL DEFAULT '';
ALTER TABLE propostas ADD COLUMN condicoes TEXT NOT NULL DEFAULT '';
ALTER TABLE propostas ADD COLUMN equipe TEXT NOT NULL DEFAULT '';

-- Uma reunião gera no máximo uma proposta (encerrar duas vezes não duplica).
CREATE UNIQUE INDEX propostas_reuniao ON propostas (reuniao_id);
