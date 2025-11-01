-- Verificar a estrutura atual da tabela orcamentos_itens
DESCRIBE orcamentos_itens;

-- Se a tabela não tiver a coluna orcamento_numero, vamos adicioná-la
-- e remover orcamento_id se existir

-- Primeiro, vamos verificar se a coluna orcamento_numero existe
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orcamentos_itens' 
  AND COLUMN_NAME = 'orcamento_numero'
);

-- Se a coluna não existir, vamos adicioná-la
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE orcamentos_itens ADD COLUMN orcamento_numero VARCHAR(20) NOT NULL AFTER id',
  'SELECT "Coluna orcamento_numero já existe" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se existe a coluna orcamento_id (que pode estar incorreta)
SET @old_column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orcamentos_itens' 
  AND COLUMN_NAME = 'orcamento_id'
);

-- Se existir orcamento_id, vamos migrar os dados para orcamento_numero e depois remover
SET @migrate_sql = IF(@old_column_exists > 0 AND @column_exists = 0,
  'UPDATE orcamentos_itens SET orcamento_numero = orcamento_id WHERE orcamento_id IS NOT NULL',
  'SELECT "Não há necessidade de migração" as status'
);

PREPARE stmt FROM @migrate_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remover a coluna orcamento_id se ela existir
SET @drop_sql = IF(@old_column_exists > 0,
  'ALTER TABLE orcamentos_itens DROP COLUMN orcamento_id',
  'SELECT "Coluna orcamento_id não existe" as status'
);

PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice na coluna orcamento_numero se não existir
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orcamentos_itens' 
  AND INDEX_NAME = 'idx_orcamento_numero'
);

SET @index_sql = IF(@index_exists = 0,
  'ALTER TABLE orcamentos_itens ADD INDEX idx_orcamento_numero (orcamento_numero)',
  'SELECT "Índice idx_orcamento_numero já existe" as status'
);

PREPARE stmt FROM @index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mostrar a estrutura final da tabela
DESCRIBE orcamentos_itens;
