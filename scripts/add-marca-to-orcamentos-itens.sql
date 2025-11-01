-- Adicionar campo marca_nome na tabela orcamentos_itens
ALTER TABLE orcamentos_itens 
ADD COLUMN marca_nome VARCHAR(255) NULL AFTER valor_total;

-- Atualizar registros existentes com a marca dos produtos
UPDATE orcamentos_itens oi
LEFT JOIN produtos p ON oi.produto_id = p.id
LEFT JOIN marcas m ON p.marca_id = m.id
SET oi.marca_nome = m.nome
WHERE oi.marca_nome IS NULL;

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
LIMIT 10;
