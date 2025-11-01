-- Verificar se a tabela contratos_conservacao existe
SHOW TABLES LIKE 'contratos_conservacao';

-- Verificar estrutura da tabela contratos_conservacao
DESCRIBE contratos_conservacao;

-- Verificar dados existentes
SELECT COUNT(*) as total_contratos FROM contratos_conservacao;

-- Verificar contratos por status
SELECT status, COUNT(*) as quantidade 
FROM contratos_conservacao 
GROUP BY status;

-- Verificar alguns registros de exemplo
SELECT 
  id,
  numero,
  cliente_id,
  status,
  data_inicio,
  data_fim,
  equipamentos_inclusos,
  created_at
FROM contratos_conservacao 
LIMIT 5;
