-- =================================================================
-- Script para adicionar o status "aguardando_pagamento"
-- =================================================================
-- INSTRUCOES: Execute os comandos na ordem, um por vez
-- =================================================================

-- PASSO 1: Alterar a coluna status para incluir o novo valor
ALTER TABLE boletos 
MODIFY COLUMN status ENUM('pendente', 'aguardando_pagamento', 'pago', 'vencido', 'cancelado') 
DEFAULT 'pendente';

-- PASSO 2: Atualizar boletos que JA foram enviados ao Asaas
-- (tem asaas_id preenchido) mas ainda estao como "pendente"
UPDATE boletos 
SET status = 'aguardando_pagamento' 
WHERE asaas_id IS NOT NULL 
AND asaas_id != '' 
AND status = 'pendente';

-- PASSO 3: Verificar quantos foram atualizados
SELECT 
  status,
  COUNT(*) as quantidade
FROM boletos 
GROUP BY status;

-- PASSO 4: Verificar estrutura da coluna
DESCRIBE boletos;
