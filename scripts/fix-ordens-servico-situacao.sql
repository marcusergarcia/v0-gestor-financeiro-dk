-- Corrigir situações indefinidas nas ordens de serviço
UPDATE ordens_servico 
SET situacao = 'rascunho' 
WHERE situacao IS NULL OR situacao = '';

-- Verificar se a coluna situacao existe e tem o tipo correto
ALTER TABLE ordens_servico 
MODIFY COLUMN situacao ENUM('rascunho', 'aberta', 'em_andamento', 'concluida', 'cancelada') 
DEFAULT 'rascunho';

-- Verificar os dados após a correção
SELECT 
  id, 
  numero, 
  situacao,
  created_at 
FROM ordens_servico 
ORDER BY created_at DESC 
LIMIT 10;
