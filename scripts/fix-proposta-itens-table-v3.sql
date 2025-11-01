-- Verificar estrutura atual da tabela proposta_itens
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'proposta_itens'
ORDER BY ORDINAL_POSITION;

-- Verificar se existe chave primária
SELECT CONSTRAINT_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'proposta_itens'
AND CONSTRAINT_NAME = 'PRIMARY';

-- Se a coluna id não for VARCHAR(36), vamos corrigir
-- Primeiro, remover a chave primária se existir
SET @sql = (SELECT IF(
    EXISTS(
        SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_itens'
        AND CONSTRAINT_NAME = 'PRIMARY'
    ),
    'ALTER TABLE proposta_itens DROP PRIMARY KEY',
    'SELECT "Nenhuma chave primária para remover"'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se a coluna id existe e seu tipo
SET @sql = (SELECT IF(
    EXISTS(
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_itens'
        AND COLUMN_NAME = 'id'
    ),
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'proposta_itens'
            AND COLUMN_NAME = 'id'
            AND DATA_TYPE = 'varchar'
            AND CHARACTER_MAXIMUM_LENGTH = 36
        ) THEN 'SELECT "Coluna id já está correta"'
        ELSE 'ALTER TABLE proposta_itens MODIFY COLUMN id VARCHAR(36) NOT NULL'
    END,
    'ALTER TABLE proposta_itens ADD COLUMN id VARCHAR(36) NOT NULL FIRST'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Gerar UUIDs para registros que têm id vazio ou nulo
UPDATE proposta_itens 
SET id = CONCAT(
    SUBSTRING(MD5(RAND()), 1, 8), '-',
    SUBSTRING(MD5(RAND()), 1, 4), '-',
    '4', SUBSTRING(MD5(RAND()), 2, 3), '-',
    SUBSTRING('89ab', FLOOR(1 + RAND() * 4), 1), SUBSTRING(MD5(RAND()), 2, 3), '-',
    SUBSTRING(MD5(RAND()), 1, 12)
)
WHERE id IS NULL OR id = '';

-- Adicionar chave primária
ALTER TABLE proposta_itens ADD PRIMARY KEY (id);

-- Verificar estrutura final
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'proposta_itens'
ORDER BY ORDINAL_POSITION;
