-- Analisar códigos de produtos existentes para entender o padrão atual
SELECT 
    p.codigo,
    p.tipo as categoria,
    p.marca,
    tp.codigo as categoria_codigo,
    m.sigla as marca_sigla,
    CASE 
        WHEN p.codigo REGEXP '^[A-Z]+[0-9]+$' THEN 'Padrão Alfanumérico'
        WHEN p.codigo REGEXP '^[0-9]+$' THEN 'Apenas Números'
        ELSE 'Outro Padrão'
    END as tipo_codigo
FROM produtos p
LEFT JOIN tipos_produtos tp ON p.tipo = tp.nome
LEFT JOIN marcas m ON p.marca = m.nome
ORDER BY p.codigo;

-- Verificar siglas das marcas mais utilizadas
SELECT 
    m.nome as marca,
    m.sigla,
    COUNT(p.id) as total_produtos,
    GROUP_CONCAT(DISTINCT p.codigo ORDER BY p.codigo SEPARATOR ', ') as exemplos_codigos
FROM marcas m
LEFT JOIN produtos p ON p.marca = m.nome
GROUP BY m.nome, m.sigla
HAVING total_produtos > 0
ORDER BY total_produtos DESC;

-- Verificar códigos das categorias mais utilizadas
SELECT 
    tp.nome as categoria,
    tp.codigo,
    COUNT(p.id) as total_produtos,
    GROUP_CONCAT(DISTINCT p.codigo ORDER BY p.codigo SEPARATOR ', ') as exemplos_codigos
FROM tipos_produtos tp
LEFT JOIN produtos p ON p.tipo = tp.nome
GROUP BY tp.nome, tp.codigo
HAVING total_produtos > 0
ORDER BY total_produtos DESC;

-- Analisar padrões de numeração por prefixo
SELECT 
    LEFT(codigo, LENGTH(codigo) - 3) as prefixo,
    RIGHT(codigo, 3) as numero,
    COUNT(*) as quantidade
FROM produtos 
WHERE codigo REGEXP '^[A-Z]+[0-9]{3}$'
GROUP BY prefixo
ORDER BY prefixo, numero;
