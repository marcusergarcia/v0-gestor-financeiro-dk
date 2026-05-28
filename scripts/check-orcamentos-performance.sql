-- Script para verificar performance das consultas de orçamentos

-- Verificar índices existentes
SHOW INDEX FROM orcamentos;
SHOW INDEX FROM orcamentos_itens;

-- Verificar estrutura das tabelas
DESCRIBE orcamentos;
DESCRIBE orcamentos_itens;

-- Testar query de próximo número (deve ser rápida)
EXPLAIN SELECT COUNT(*) + 1 as proximo FROM orcamentos WHERE DATE(created_at) = CURDATE();

-- Verificar últimos orçamentos
SELECT numero, cliente_id, created_at FROM orcamentos ORDER BY created_at DESC LIMIT 5;

-- Verificar conexões ativas
SHOW PROCESSLIST;
