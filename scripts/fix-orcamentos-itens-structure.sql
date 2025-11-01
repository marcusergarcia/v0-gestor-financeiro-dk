-- Verificar se a tabela orcamentos_itens existe
CREATE TABLE IF NOT EXISTS orcamentos_itens (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  orcamento_numero VARCHAR(20) NOT NULL,
  produto_id VARCHAR(36) NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  marca_nome VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Verificar se a coluna orcamento_numero existe, se não existir, criar
ALTER TABLE orcamentos_itens ADD COLUMN IF NOT EXISTS orcamento_numero VARCHAR(20) NULL;

-- Verificar se a coluna marca_nome existe, se não existir, criar
ALTER TABLE orcamentos_itens ADD COLUMN IF NOT EXISTS marca_nome VARCHAR(100) NULL;

-- Remover a foreign key antiga se existir
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'orcamentos_itens' 
  AND COLUMN_NAME = 'orcamento_id' 
  AND REFERENCED_TABLE_NAME = 'orcamentos'
  AND CONSTRAINT_SCHEMA = DATABASE()
);

SET @drop_fk_query = IF(
  @constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE orcamentos_itens DROP FOREIGN KEY ', @constraint_name),
  'SELECT 1'
);

PREPARE stmt FROM @drop_fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar a nova foreign key se não existir
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'orcamentos_itens' 
  AND COLUMN_NAME = 'orcamento_numero' 
  AND REFERENCED_TABLE_NAME = 'orcamentos'
  AND CONSTRAINT_SCHEMA = DATABASE()
);

SET @add_fk_query = IF(
  @constraint_name IS NULL,
  'ALTER TABLE orcamentos_itens ADD CONSTRAINT fk_orcamentos_itens_orcamento FOREIGN KEY (orcamento_numero) REFERENCES orcamentos(numero) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt FROM @add_fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_orcamento_numero ON orcamentos_itens(orcamento_numero);
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_produto_id ON orcamentos_itens(produto_id);
