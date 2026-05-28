-- Script para atualizar o campo marca_nome na tabela orcamentos_itens
-- Primeiro, verificar a estrutura atual
DESCRIBE orcamentos_itens;

-- Verificar alguns registros antes da atualização
SELECT 
    oi.id,
    oi.produto_id,
    p.descricao as produto_descricao,
    p.marca as produto_marca,
    oi.marca_nome
FROM orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
WHERE oi.marca_nome IS NULL
LIMIT 5;

-- Atualizar usando sintaxe compatível com MySQL
UPDATE orcamentos_itens oi
INNER JOIN produtos p ON oi.produto_id = p.id
SET oi.marca_nome = p.marca
WHERE oi.marca_nome IS NULL 
AND p.marca IS NOT NULL 
AND p.marca != '';

-- Verificar quantos registros foram atualizados
SELECT COUNT(*) as registros_atualizados
FROM orcamentos_itens oi
INNER JOIN produtos p ON oi.produto_id = p.id
WHERE oi.marca_nome IS NOT NULL;

-- Verificar alguns registros após a atualização
SELECT 
    oi.id,
    oi.produto_id,
    p.descricao as produto_descricao,
    p.marca as produto_marca,
    oi.marca_nome
FROM orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
WHERE oi.marca_nome IS NOT NULL
LIMIT 10;
