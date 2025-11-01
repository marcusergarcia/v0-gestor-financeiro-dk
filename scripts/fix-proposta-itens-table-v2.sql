-- Verificar estrutura atual da tabela proposta_itens
DESCRIBE proposta_itens;

-- Verificar chaves primárias existentes
SHOW INDEX FROM proposta_itens WHERE Key_name = 'PRIMARY';

-- Remover a chave primária existente se necessário
ALTER TABLE proposta_itens DROP PRIMARY KEY;

-- Adicionar coluna id se não existir
ALTER TABLE proposta_itens 
ADD COLUMN id VARCHAR(36) NOT NULL FIRST;

-- Definir nova chave primária
ALTER TABLE proposta_itens 
ADD PRIMARY KEY (id);

-- Gerar UUIDs para registros existentes que não tenham id
UPDATE proposta_itens 
SET id = UUID() 
WHERE id = '' OR id IS NULL;

-- Verificar se a foreign key existe e remover se necessário
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'proposta_itens' 
                  AND CONSTRAINT_NAME = 'fk_proposta_itens_proposta');

SET @sql = IF(@fk_exists > 0, 
              'ALTER TABLE proposta_itens DROP FOREIGN KEY fk_proposta_itens_proposta', 
              'SELECT "FK não existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar foreign key correta
ALTER TABLE proposta_itens 
ADD CONSTRAINT fk_proposta_itens_proposta 
FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(numero) 
ON DELETE CASCADE;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_proposta_itens_proposta ON proposta_itens(proposta_id);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_equipamento ON proposta_itens(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_categoria ON proposta_itens(categoria);

-- Verificar estrutura final
DESCRIBE proposta_itens;
