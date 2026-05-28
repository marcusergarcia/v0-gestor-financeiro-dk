-- Verificar estrutura das tabelas
DESCRIBE ordens_servico;
DESCRIBE ordens_servico_itens;
DESCRIBE equipamentos;

-- Verificar se existem dados de teste
SELECT COUNT(*) as total_ordens FROM ordens_servico;
SELECT COUNT(*) as total_equipamentos FROM equipamentos;
SELECT COUNT(*) as total_itens FROM ordens_servico_itens;

-- Verificar últimas ordens criadas
SELECT 
  os.id,
  os.numero,
  os.cliente_id,
  os.tipo_servico,
  os.nome_responsavel,
  os.created_at
FROM ordens_servico os
ORDER BY os.created_at DESC
LIMIT 5;

-- Verificar itens das últimas ordens
SELECT 
  osi.id,
  osi.ordem_servico_id,
  osi.equipamento_id,
  osi.equipamento_nome,
  osi.quantidade,
  osi.observacoes,
  osi.situacao,
  os.numero as ordem_numero
FROM ordens_servico_itens osi
JOIN ordens_servico os ON osi.ordem_servico_id = os.id
ORDER BY osi.created_at DESC
LIMIT 10;

-- Verificar foreign keys
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('ordens_servico_itens')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
