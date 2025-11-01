-- Verificar o tipo de coluna numero na tabela proposta_contratos
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'proposta_contratos'
  AND COLUMN_NAME = 'numero';

-- Verificar propostas existentes
SELECT 
  numero,
  cliente_id,
  data_criacao,
  LENGTH(numero) as tamanho_numero
FROM proposta_contratos
ORDER BY numero DESC
LIMIT 10;
