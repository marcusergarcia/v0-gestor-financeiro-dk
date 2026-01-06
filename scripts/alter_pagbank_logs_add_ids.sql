-- Adicionar colunas de IDs faltantes na tabela pagbank_logs
ALTER TABLE pagbank_logs 
  ADD COLUMN IF NOT EXISTS order_id VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS charge_id VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100) NULL;
