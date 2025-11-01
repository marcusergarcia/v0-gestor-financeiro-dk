-- Adicionar colunas para valores ajustados na tabela orcamentos_itens
ALTER TABLE orcamentos_itens 
ADD COLUMN IF NOT EXISTS valor_unitario_ajustado DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS valor_total_ajustado DECIMAL(10,2) NULL;

-- Verificar se a coluna id existe e tem o tipo correto
DESCRIBE orcamentos_itens;

-- Se necessário, corrigir a estrutura da tabela
-- ALTER TABLE orcamentos_itens MODIFY COLUMN id VARCHAR(36) NOT NULL;
