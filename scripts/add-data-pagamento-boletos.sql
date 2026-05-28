-- Adicionar campo data_pagamento na tabela boletos
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS data_pagamento DATE NULL AFTER data_vencimento;

-- Atualizar boletos já pagos para ter data de pagamento igual à data de vencimento (se não tiver)
UPDATE boletos 
SET data_pagamento = data_vencimento 
WHERE status = 'pago' AND data_pagamento IS NULL;
