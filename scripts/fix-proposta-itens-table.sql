-- Verificar estrutura atual da tabela proposta_itens
DESCRIBE proposta_itens;

-- Se a coluna id não existir ou não for VARCHAR(36), vamos corrigir
ALTER TABLE proposta_itens 
MODIFY COLUMN id VARCHAR(36) NOT NULL PRIMARY KEY;

-- Verificar se há registros com id vazio e corrigi-los
UPDATE proposta_itens 
SET id = UUID() 
WHERE id = '' OR id IS NULL;

-- Garantir que a foreign key está correta
ALTER TABLE proposta_itens 
ADD CONSTRAINT fk_proposta_itens_proposta 
FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(numero) 
ON DELETE CASCADE;

-- Verificar índices
SHOW INDEX FROM proposta_itens;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_proposta_itens_proposta ON proposta_itens(proposta_id);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_equipamento ON proposta_itens(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_categoria ON proposta_itens(categoria);
