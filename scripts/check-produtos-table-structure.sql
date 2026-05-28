-- Verificar estrutura da tabela produtos
DESCRIBE produtos;

-- Verificar se existe campo relacionado à marca
SHOW COLUMNS FROM produtos LIKE '%marca%';

-- Verificar dados de exemplo
SELECT * FROM produtos LIMIT 5;

-- Verificar estrutura da tabela marcas
DESCRIBE marcas;

-- Verificar relação entre produtos e marcas
SELECT 
    p.id,
    p.descricao,
    p.*
FROM produtos p
LIMIT 5;
