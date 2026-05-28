-- Remover os campos categoria_id e marca_id da tabela produtos
-- e ajustar as chaves estrangeiras

-- 1. Primeiro, remover as chaves estrangeiras se existirem
ALTER TABLE produtos DROP FOREIGN KEY IF EXISTS fk_produtos_categoria;
ALTER TABLE produtos DROP FOREIGN KEY IF EXISTS fk_produtos_marca;

-- 2. Remover os campos categoria_id e marca_id
ALTER TABLE produtos DROP COLUMN IF EXISTS categoria_id;
ALTER TABLE produtos DROP COLUMN IF EXISTS marca_id;

-- 3. Modificar os campos tipo e marca para serem chaves estrangeiras
-- Alterar o campo tipo para ser INT e referenciar tipos_produtos
ALTER TABLE produtos MODIFY COLUMN tipo INT NULL;

-- Alterar o campo marca para ser INT e referenciar marcas
ALTER TABLE produtos MODIFY COLUMN marca INT NULL;

-- 4. Adicionar as chaves estrangeiras corretas
ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_tipo 
FOREIGN KEY (tipo) REFERENCES tipos_produtos(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE produtos 
ADD CONSTRAINT fk_produtos_marca 
FOREIGN KEY (marca) REFERENCES marcas(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Criar índices para melhor performance
CREATE INDEX idx_produtos_tipo ON produtos(tipo);
CREATE INDEX idx_produtos_marca ON produtos(marca);

-- 6. Verificar a estrutura final
DESCRIBE produtos;
