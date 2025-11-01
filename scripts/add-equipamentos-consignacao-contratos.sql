-- Adicionar campo equipamentos_consignacao na tabela contratos
ALTER TABLE contratos 
ADD COLUMN equipamentos_consignacao TEXT NULL AFTER equipamentos_inclusos;

-- Atualizar comentário da coluna
ALTER TABLE contratos 
MODIFY COLUMN equipamentos_consignacao TEXT NULL 
COMMENT 'Equipamentos em consignação fornecidos ao cliente';
