-- Script para adicionar o status "aguardando_pagamento" ao ENUM da tabela boletos
-- Este status indica que o boleto foi enviado ao Asaas e está aguardando pagamento

-- IMPORTANTE: Execute este script no MySQL antes de usar o novo status

-- 1. Alterar a coluna status para incluir o novo valor
ALTER TABLE boletos 
MODIFY COLUMN status ENUM('pendente', 'aguardando_pagamento', 'pago', 'vencido', 'cancelado') 
DEFAULT 'pendente';

-- 2. Verificar se a alteração foi aplicada
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'boletos' AND COLUMN_NAME = 'status';

-- NOTA: Boletos que já foram enviados ao Asaas (tem asaas_id) mas estão pendentes
-- podem ser atualizados para o novo status se desejado:
-- UPDATE boletos SET status = 'aguardando_pagamento' WHERE asaas_id IS NOT NULL AND status = 'pendente';
