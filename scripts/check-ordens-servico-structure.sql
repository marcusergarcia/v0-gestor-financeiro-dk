-- Verificar a estrutura atual da tabela ordens_servico
DESCRIBE ordens_servico;

-- Verificar se existem registros
SELECT COUNT(*) as total_registros FROM ordens_servico;

-- Verificar os últimos registros
SELECT * FROM ordens_servico ORDER BY created_at DESC LIMIT 5;
