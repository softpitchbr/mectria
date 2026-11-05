-- Fase 3 (correção): uma anotação técnica gera no máximo uma pendência,
-- mesmo quando o pedido cai no meio e o computador manda de novo.
CREATE UNIQUE INDEX pendencias_anotacao ON pendencias (anotacao_id);
