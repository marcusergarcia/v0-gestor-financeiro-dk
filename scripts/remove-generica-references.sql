-- Script para remover referências à marca "Genérica" da tabela produtos
-- e limpar dados inconsistentes

-- 1. Verificar produtos com marca "Genérica" ou similar
SELECT 
    id, codigo, descricao, marca, tipo
FROM produtos 
WHERE marca LIKE '%genérica%' OR marca LIKE '%Genérica%' OR marca LIKE '%GENÉRICA%';

-- 2. Atualizar produtos com marca "Genérica" para "Nenhuma marca"
UPDATE produtos 
SET marca = 'Nenhuma marca', updated_at = NOW()
WHERE marca LIKE '%genérica%' OR marca LIKE '%Genérica%' OR marca LIKE '%GENÉRICA%';

-- 3. Verificar se existem marcas "Genérica" na tabela marcas
SELECT * FROM marcas 
WHERE nome LIKE '%genérica%' OR nome LIKE '%Genérica%' OR nome LIKE '%GENÉRICA%';

-- 4. Remover marca "Genérica" da tabela marcas se existir
DELETE FROM marcas 
WHERE nome LIKE '%genérica%' OR nome LIKE '%Genérica%' OR nome LIKE '%GENÉRICA%';

-- 5. Verificar produtos com valores inválidos
SELECT 
    id, codigo, descricao, marca, tipo
FROM produtos 
WHERE marca = '' OR marca IS NULL OR marca = '0'
   OR tipo = '' OR tipo IS NULL OR tipo = '0';

-- 6. Corrigir valores vazios ou nulos
UPDATE produtos 
SET 
    marca = CASE 
        WHEN marca = '' OR marca IS NULL OR marca = '0' THEN 'Nenhuma marca'
        ELSE marca 
    END,
    tipo = CASE 
        WHEN tipo = '' OR tipo IS NULL OR tipo = '0' THEN 'Nenhuma categoria'
        ELSE tipo 
    END,
    updated_at = NOW()
WHERE marca IN ('', '0') OR marca IS NULL 
   OR tipo IN ('', '0') OR tipo IS NULL;

-- 7. Verificar resultado final
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN marca = 'Nenhuma marca' THEN 1 END) as sem_marca,
    COUNT(CASE WHEN tipo = 'Nenhuma categoria' THEN 1 END) as sem_categoria
FROM produtos;

-- 8. Listar produtos atualizados
SELECT 
    id, codigo, descricao, marca, tipo, updated_at
FROM produtos 
WHERE marca = 'Nenhuma marca' OR tipo = 'Nenhuma categoria'
ORDER BY updated_at DESC
LIMIT 10;
