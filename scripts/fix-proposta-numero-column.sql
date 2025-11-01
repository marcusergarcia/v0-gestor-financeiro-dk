-- Ajustar a coluna numero para suportar o novo formato (YYYYMMDD + 3 dígitos = 11 caracteres)
ALTER TABLE proposta_contratos 
MODIFY COLUMN numero VARCHAR(20) NOT NULL UNIQUE;

-- Adicionar índice para melhorar performance das consultas por data
CREATE INDEX idx_proposta_numero_data ON proposta_contratos(numero);
