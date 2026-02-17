-- Adicionar coluna ambiente na tabela nfe_emitidas
-- 1 = Producao, 2 = Homologacao
ALTER TABLE nfe_emitidas ADD COLUMN IF NOT EXISTS ambiente TINYINT DEFAULT 2 AFTER natureza_operacao;

-- Atualizar notas existentes como homologacao (default seguro)
UPDATE nfe_emitidas SET ambiente = 2 WHERE ambiente IS NULL;
