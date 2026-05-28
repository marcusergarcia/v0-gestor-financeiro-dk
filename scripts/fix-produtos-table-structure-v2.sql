-- Script para corrigir a estrutura da tabela produtos
-- Removendo campos conflitantes e ajustando chaves estrangeiras

-- 1. Primeiro, verificar se existem chaves estrangeiras e removê-las
SET FOREIGN_KEY_CHECKS = 0;

-- Remover chaves estrangeiras existentes se houver
ALTER TABLE produtos DROP FOREIGN KEY IF EXISTS fk_produtos_categoria;
ALTER TABLE produtos DROP FOREIGN KEY IF EXISTS fk_produtos_marca;
ALTER TABLE produtos DROP FOREIGN KEY IF EXISTS fk_produtos_tipo;

-- 2. Verificar e limpar dados inconsistentes antes de criar as FKs
-- Limpar valores no campo tipo que não existem na tabela tipos_produtos
UPDATE produtos SET tipo = NULL WHERE tipo NOT IN (SELECT id FROM tipos_produtos);

-- Limpar valores no campo marca que não existem na tabela marcas  
UPDATE produtos SET marca = NULL WHERE marca NOT IN (SELECT id FROM marcas);

-- 3. Remover os campos categoria_id e marca_id se existirem
ALTER TABLE produtos DROP COLUMN IF EXISTS categoria_id;
ALTER TABLE produtos DROP COLUMN IF EXISTS marca_id;

-- 4. Garantir que os campos tipo e marca sejam INT
ALTER TABLE produtos MODIFY COLUMN tipo INT NULL;
ALTER TABLE produtos MODIFY COLUMN marca INT NULL;

-- 5. Verificar se as tabelas de referência existem
SELECT 'Verificando tabela tipos_produtos' as status;
SELECT COUNT(*) as total_tipos FROM tipos_produtos;

SELECT 'Verificando tabela marcas' as status;
SELECT COUNT(*) as total_marcas FROM marcas;

-- 6. Adicionar as chaves estrangeiras uma por vez
ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_tipo 
FOREIGN KEY (tipo) REFERENCES tipos_produtos(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_marca 
FOREIGN KEY (marca) REFERENCES marcas(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Reativar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos(marca);

-- 9. Verificar a estrutura final
DESCRIBE produtos;

-- 10. Mostrar as chaves estrangeiras criadas
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'produtos' 
AND TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL;
