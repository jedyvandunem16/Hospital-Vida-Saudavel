-- ================================================================
--  GHospital — Migrações de base de dados
--  Executar uma vez após o db:setup inicial.
--  Seguras para re-executar (IF NOT EXISTS / IF EXISTS).
-- ================================================================

-- [ALTA 1] Auditoria de cancelamento em consultas
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS cancelado_por INT          NULL COMMENT 'ID do utilizador que cancelou',
  ADD COLUMN IF NOT EXISTS cancelado_em  DATETIME     NULL COMMENT 'Data/hora do cancelamento';

ALTER TABLE consultas
  ADD CONSTRAINT IF NOT EXISTS fk_cancelado_por
  FOREIGN KEY (cancelado_por) REFERENCES utilizadores(id) ON DELETE SET NULL;

-- [MÉDIA 2] Timestamp de actualização em pacientes
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS atualizado_em DATETIME NULL
    DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    COMMENT 'Actualizado automaticamente pelo MySQL';

-- [MÉDIA 1] Duração da consulta (usada na verificação de conflitos)
-- A coluna duracao_min já existia — garantir que tem valor default
ALTER TABLE consultas
  MODIFY COLUMN duracao_min INT NOT NULL DEFAULT 30
  COMMENT 'Duração em minutos — usada na verificação de sobreposição de horário';

-- Índice para acelerar a query de conflito de horário
CREATE INDEX IF NOT EXISTS idx_consultas_medico_hora
  ON consultas (medico_id, data_hora, estado);