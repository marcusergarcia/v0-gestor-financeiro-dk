-- Adicionar campos de coordenadas da empresa na tabela timbrado_config
-- Esses campos são necessários para calcular a distância entre a empresa e os clientes

ALTER TABLE timbrado_config 
ADD COLUMN IF NOT EXISTS empresa_latitude DECIMAL(10, 8) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS empresa_longitude DECIMAL(11, 8) DEFAULT NULL;

-- Verificar se os campos foram adicionados
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'timbrado_config' 
AND COLUMN_NAME IN ('empresa_latitude', 'empresa_longitude');
