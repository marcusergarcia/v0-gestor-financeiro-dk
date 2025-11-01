-- Verificar se a tabela equipamentos existe
SHOW TABLES LIKE 'equipamentos';

-- Verificar estrutura da tabela
DESCRIBE equipamentos;

-- Contar equipamentos
SELECT COUNT(*) as total_equipamentos FROM equipamentos;

-- Contar equipamentos ativos
SELECT COUNT(*) as equipamentos_ativos FROM equipamentos WHERE ativo = 1;

-- Listar alguns equipamentos para teste
SELECT id, nome, categoria, valor_hora, ativo FROM equipamentos LIMIT 10;

-- Verificar se há equipamentos inativos
SELECT COUNT(*) as equipamentos_inativos FROM equipamentos WHERE ativo = 0;
