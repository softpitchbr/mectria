-- Fase 6: mês para retomar a oportunidade em nutrição (reativação) e a resposta de Projetos às pendências.
ALTER TABLE oportunidades ADD COLUMN retomar_em TEXT;
ALTER TABLE pendencias ADD COLUMN respondida_em TEXT;
ALTER TABLE pendencias ADD COLUMN respondida_por INTEGER REFERENCES pessoas(id);
