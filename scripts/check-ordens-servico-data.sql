-- Verificar dados na tabela principal
SELECT * FROM ordens_servico;

-- Verificar dados nos itens
SELECT * FROM ordens_servico_itens;

-- Verificar dados nas fotos
SELECT * FROM ordens_servico_fotos;

-- Verificar dados nas assinaturas
SELECT * FROM ordens_servico_assinaturas;

-- Verificar se existe ordem com id=1
SELECT COUNT(*) as total FROM ordens_servico WHERE id = 1;
