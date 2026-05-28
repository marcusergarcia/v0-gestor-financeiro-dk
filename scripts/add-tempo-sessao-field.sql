-- Adicionar campo tempo_sessao na tabela logs_sistema
ALTER TABLE logs_sistema 
ADD COLUMN tempo_sessao INT NULL AFTER sessao_id;

-- Verificar se o campo foi adicionado
DESCRIBE logs_sistema;
