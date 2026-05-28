-- Primeiro, vamos verificar a estrutura atual
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'produtos' 
AND TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME LIKE '%marca%';

-- Verificar se existe campo marca diretamente na tabela produtos
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'produtos' 
AND TABLE_SCHEMA = DATABASE();

-- Atualizar baseado na estrutura real da tabela produtos
-- Se a marca estiver diretamente na tabela produtos como 'marca':
UPDATE orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
SET oi.marca_nome = p.marca
WHERE oi.marca_nome IS NULL AND p.marca IS NOT NULL;

-- Se não funcionar, vamos tentar com outras possíveis estruturas
-- Verificar registros após atualização
SELECT 
    oi.id,
    oi.produto_id,
    p.descricao as produto_descricao,
    p.marca as produto_marca,
    oi.marca_nome
FROM orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
LIMIT 10;
