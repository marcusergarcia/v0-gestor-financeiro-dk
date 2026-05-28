-- Remover a constraint incorreta se existir
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS fk_orcamentos_itens_orcamento;

-- Verificar se a coluna orcamento_id existe, se não, criar
ALTER TABLE orcamentos_itens 
ADD COLUMN IF NOT EXISTS orcamento_id VARCHAR(36) AFTER id;

-- Remover a coluna orcamento_numero se existir
ALTER TABLE orcamentos_itens DROP COLUMN IF EXISTS orcamento_numero;

-- Adicionar a foreign key correta (referenciando orcamentos.id, não orcamentos.numero)
ALTER TABLE orcamentos_itens 
ADD CONSTRAINT fk_orcamentos_itens_orcamento 
FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Verificar se a coluna id na tabela orcamentos tem valor padrão
ALTER TABLE orcamentos MODIFY COLUMN id VARCHAR(36) NOT NULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_orcamento_id ON orcamentos_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero);
