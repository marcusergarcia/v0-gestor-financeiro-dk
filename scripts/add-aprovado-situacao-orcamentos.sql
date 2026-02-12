-- Alterar coluna situacao de ENUM para VARCHAR para suportar todos os status
-- incluindo 'aprovado', 'enviado por email', 'nota fiscal emitida', 'concluido'
ALTER TABLE orcamentos MODIFY COLUMN situacao VARCHAR(50) NOT NULL DEFAULT 'pendente';
