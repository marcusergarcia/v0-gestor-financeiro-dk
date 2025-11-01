-- Script para corrigir valores "0" na tabela produtos
-- Substitui "0" por "Nenhuma categoria" e "Nenhuma marca"

-- Verificar estado atual
SELECT 'ANTES DAS ALTERAÇÕES' as status;
SELECT 
    COUNT(*) as total_produtos,
    SUM(CASE WHEN tipo = '0' THEN 1 ELSE 0 END) as produtos_sem_categoria,
    SUM(CASE WHEN marca = '0' THEN 1 ELSE 0 END) as produtos_sem_marca
FROM produtos;

-- Mostrar produtos com valores "0"
SELECT id, codigo, descricao, tipo, marca 
FROM produtos 
WHERE tipo = '0' OR marca = '0'
LIMIT 10;

-- Atualizar campo tipo (categoria)
UPDATE produtos 
SET tipo = 'Nenhuma categoria' 
WHERE tipo = '0' OR tipo = '' OR tipo IS NULL;

-- Atualizar campo marca
UPDATE produtos 
SET marca = 'Nenhuma marca' 
WHERE marca = '0' OR marca = '' OR marca IS NULL;

-- Verificar após alterações
SELECT 'APÓS AS ALTERAÇÕES' as status;
SELECT 
    COUNT(*) as total_produtos,
    SUM(CASE WHEN tipo = 'Nenhuma categoria' THEN 1 ELSE 0 END) as produtos_sem_categoria,
    SUM(CASE WHEN marca = 'Nenhuma marca' THEN 1 ELSE 0 END) as produtos_sem_marca
FROM produtos;

-- Mostrar alguns produtos atualizados
SELECT id, codigo, descricao, tipo, marca 
FROM produtos 
WHERE tipo = 'Nenhuma categoria' OR marca = 'Nenhuma marca'
LIMIT 10;

-- Estatísticas finais
SELECT 
    'RESUMO FINAL' as status,
    COUNT(DISTINCT tipo) as total_categorias,
    COUNT(DISTINCT marca) as total_marcas
FROM produtos;
