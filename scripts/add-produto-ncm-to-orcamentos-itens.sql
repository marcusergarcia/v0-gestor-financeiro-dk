-- Adicionar campo produto_ncm na tabela orcamentos_itens
ALTER TABLE orcamentos_itens 
ADD COLUMN produto_ncm VARCHAR(20) NULL AFTER marca_nome;

-- Comentário para documentar o campo
ALTER TABLE orcamentos_itens 
MODIFY COLUMN produto_ncm VARCHAR(20) NULL COMMENT 'NCM do produto no momento da criação do orçamento';

-- Verificar a estrutura da tabela
DESCRIBE orcamentos_itens;
