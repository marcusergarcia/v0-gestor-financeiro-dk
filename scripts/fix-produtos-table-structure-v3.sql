-- Script simplificado para corrigir a estrutura da tabela produtos
-- Sem usar comandos que requerem permissões especiais

-- 1. Primeiro, vamos verificar a estrutura atual
SELECT 'Estrutura atual da tabela produtos:' as info;
DESCRIBE produtos;

-- 2. Verificar se existem dados inconsistentes
SELECT 'Verificando dados inconsistentes no campo tipo:' as info;
SELECT COUNT(*) as produtos_com_tipo_invalido 
FROM produtos 
WHERE tipo IS NOT NULL 
AND tipo NOT IN (SELECT id FROM tipos_produtos);

SELECT 'Verificando dados inconsistentes no campo marca:' as info;
SELECT COUNT(*) as produtos_com_marca_invalida 
FROM produtos 
WHERE marca IS NOT NULL 
AND marca NOT IN (SELECT id FROM marcas);

-- 3. Limpar dados inconsistentes
UPDATE produtos SET tipo = NULL 
WHERE tipo IS NOT NULL 
AND tipo NOT IN (SELECT id FROM tipos_produtos);

UPDATE produtos SET marca = NULL 
WHERE marca IS NOT NULL 
AND marca NOT IN (SELECT id FROM marcas);

-- 4. Remover os campos categoria_id e marca_id se existirem
-- Primeiro verificamos se existem
SELECT 'Removendo campos conflitantes...' as info;

-- Para categoria_id
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'produtos' 
   AND COLUMN_NAME = 'categoria_id' 
   AND TABLE_SCHEMA = DATABASE()) > 0,
  'ALTER TABLE produtos DROP COLUMN categoria_id',
  'SELECT "Campo categoria_id não existe" as info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Para marca_id
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'produtos' 
   AND COLUMN_NAME = 'marca_id' 
   AND TABLE_SCHEMA = DATABASE()) > 0,
  'ALTER TABLE produtos DROP COLUMN marca_id',
  'SELECT "Campo marca_id não existe" as info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Garantir que os campos tipo e marca sejam INT
ALTER TABLE produtos MODIFY COLUMN tipo INT NULL;
ALTER TABLE produtos MODIFY COLUMN marca INT NULL;

-- 6. Tentar adicionar as chaves estrangeiras
-- Para o campo tipo
SELECT 'Adicionando chave estrangeira para tipo...' as info;
ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_tipo 
FOREIGN KEY (tipo) REFERENCES tipos_produtos(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Para o campo marca
SELECT 'Adicionando chave estrangeira para marca...' as info;
ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_marca 
FOREIGN KEY (marca) REFERENCES marcas(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Criar índices para melhor performance
CREATE INDEX idx_produtos_tipo ON produtos(tipo);
CREATE INDEX idx_produtos_marca ON produtos(marca);

-- 8. Verificar a estrutura final
SELECT 'Estrutura final da tabela produtos:' as info;
DESCRIBE produtos;

-- 9. Verificar alguns dados de exemplo
SELECT 'Exemplo de dados com relacionamentos:' as info;
SELECT 
    p.id,
    p.codigo,
    p.descricao,
    p.tipo,
    tp.nome as tipo_nome,
    p.marca,
    m.nome as marca_nome
FROM produtos p
LEFT JOIN tipos_produtos tp ON p.tipo = tp.id
LEFT JOIN marcas m ON p.marca = m.id
LIMIT 5;
