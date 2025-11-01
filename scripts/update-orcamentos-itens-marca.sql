-- Atualizar registros existentes na tabela orcamentos_itens com a marca dos produtos
UPDATE orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
LEFT JOIN marcas m ON p.marca_id = m.id
SET oi.marca_nome = m.nome
WHERE oi.marca_nome IS NULL AND m.nome IS NOT NULL;

-- Verificar se a atualização foi bem-sucedida
SELECT 
    oi.id,
    oi.produto_id,
    p.descricao as produto_descricao,
    oi.marca_nome,
    m.nome as marca_atual
FROM orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
LEFT JOIN marcas m ON p.marca_id = m.id
WHERE oi.marca_nome IS NOT NULL
LIMIT 10;

-- Contar quantos registros foram atualizados
SELECT 
    COUNT(*) as total_itens,
    COUNT(oi.marca_nome) as itens_com_marca,
    COUNT(*) - COUNT(oi.marca_nome) as itens_sem_marca
FROM orcamentos_itens oi;
