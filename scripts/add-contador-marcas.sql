-- Adicionar campo contador na tabela marcas se não existir
ALTER TABLE marcas 
ADD COLUMN IF NOT EXISTS contador INT DEFAULT 0 COMMENT 'Contador sequencial para geração de códigos de produtos';

-- Atualizar contador para marcas que já têm produtos
UPDATE marcas m 
SET contador = (
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(p.codigo, LENGTH(CONCAT(tp.codigo, m.sigla)) + 1) AS UNSIGNED)
    ), 0)
    FROM produtos p
    LEFT JOIN tipos_produtos tp ON p.tipo = tp.nome
    WHERE p.marca = m.nome 
    AND p.codigo LIKE CONCAT(tp.codigo, m.sigla, '%')
    AND LENGTH(p.codigo) = LENGTH(CONCAT(tp.codigo, m.sigla)) + 3
    AND p.codigo REGEXP CONCAT('^', tp.codigo, m.sigla, '[0-9]{3}$')
)
WHERE EXISTS (
    SELECT 1 FROM produtos p2 WHERE p2.marca = m.nome
);

-- Verificar resultado
SELECT 
    m.nome,
    m.sigla,
    m.contador,
    COUNT(p.id) as total_produtos
FROM marcas m
LEFT JOIN produtos p ON p.marca = m.nome
GROUP BY m.id, m.nome, m.sigla, m.contador
ORDER BY m.nome;
