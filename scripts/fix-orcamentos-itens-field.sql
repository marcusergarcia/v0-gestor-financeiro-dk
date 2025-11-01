-- Verificar se a tabela orcamentos_itens tem o campo correto
DESCRIBE orcamentos_itens;

-- Se a tabela tiver orcamento_numero em vez de orcamento_id, execute:
-- ALTER TABLE orcamentos_itens 
-- ADD COLUMN orcamento_id INT,
-- ADD FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id);

-- Migrar dados se necessário:
-- UPDATE orcamentos_itens oi 
-- INNER JOIN orcamentos o ON oi.orcamento_numero = o.numero 
-- SET oi.orcamento_id = o.id;

-- Remover coluna antiga após migração:
-- ALTER TABLE orcamentos_itens DROP COLUMN orcamento_numero;
