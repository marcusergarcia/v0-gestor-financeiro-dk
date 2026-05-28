-- Verificar estrutura da tabela proposta_contratos
DESCRIBE proposta_contratos;

-- Verificar se existem registros
SELECT COUNT(*) as total_propostas FROM proposta_contratos;

-- Verificar último número
SELECT numero FROM proposta_contratos ORDER BY numero DESC LIMIT 1;

-- Verificar estrutura da tabela proposta_itens
DESCRIBE proposta_itens;

-- Verificar se existem registros de itens
SELECT COUNT(*) as total_itens FROM proposta_itens;
