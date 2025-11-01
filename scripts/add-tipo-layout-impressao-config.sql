-- Adicionar campo 'tipo' na tabela layout_impressao_config
ALTER TABLE layout_impressao_config 
ADD COLUMN tipo ENUM('contrato', 'orcamento') NOT NULL DEFAULT 'contrato' AFTER nome;

-- Atualizar registros existentes (opcional - definir como 'contrato' por padrão)
UPDATE layout_impressao_config 
SET tipo = 'contrato' 
WHERE tipo IS NULL OR tipo = '';

-- Adicionar índice para melhorar performance de busca por tipo
CREATE INDEX idx_layout_tipo ON layout_impressao_config(tipo);
