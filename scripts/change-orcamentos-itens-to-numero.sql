-- Primeiro, vamos verificar a estrutura atual
DESCRIBE orcamentos_itens;

-- Remover a constraint de foreign key existente se houver
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS fk_orcamentos_itens_orcamento;
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS orcamentos_itens_ibfk_1;

-- Se o campo orcamento_id existe, vamos renomeá-lo para orcamento_numero
-- e alterar seu tipo para VARCHAR para corresponder ao campo numero da tabela orcamentos
ALTER TABLE orcamentos_itens 
CHANGE COLUMN orcamento_id orcamento_numero VARCHAR(20) NOT NULL;

-- Ou se o campo não existe, vamos criá-lo
-- ALTER TABLE orcamentos_itens 
-- ADD COLUMN orcamento_numero VARCHAR(20) NOT NULL AFTER id;

-- Criar a nova foreign key constraint referenciando orcamentos.numero
ALTER TABLE orcamentos_itens 
ADD CONSTRAINT fk_orcamentos_itens_numero 
FOREIGN KEY (orcamento_numero) 
REFERENCES orcamentos(numero) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Criar índice para performance
CREATE INDEX idx_orcamentos_itens_numero ON orcamentos_itens(orcamento_numero);

-- Verificar a estrutura final
DESCRIBE orcamentos_itens;
SHOW CREATE TABLE orcamentos_itens;
