-- Script para adicionar campos do Asaas na tabela boletos
-- Permite integração paralela com PagBank e Asaas

-- Adicionar campos do Asaas na tabela boletos
ALTER TABLE boletos
ADD COLUMN IF NOT EXISTS asaas_id VARCHAR(100) COMMENT 'ID do pagamento no Asaas (pay_xxx)',
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100) COMMENT 'ID do cliente no Asaas (cus_xxx)',
ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT COMMENT 'URL da fatura do Asaas',
ADD COLUMN IF NOT EXISTS asaas_bankslip_url TEXT COMMENT 'URL do boleto PDF do Asaas',
ADD COLUMN IF NOT EXISTS asaas_barcode VARCHAR(100) COMMENT 'Código de barras do Asaas',
ADD COLUMN IF NOT EXISTS asaas_linha_digitavel VARCHAR(100) COMMENT 'Linha digitável do Asaas',
ADD COLUMN IF NOT EXISTS asaas_nosso_numero VARCHAR(50) COMMENT 'Nosso número do Asaas',
ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT NULL COMMENT 'Gateway utilizado: pagbank ou asaas';

-- Adicionar campo asaas_id na tabela clientes para armazenar o ID do cliente no Asaas
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS asaas_id VARCHAR(100) COMMENT 'ID do cliente no Asaas (cus_xxx)';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_boletos_asaas_id ON boletos(asaas_id);
CREATE INDEX IF NOT EXISTS idx_boletos_gateway ON boletos(gateway);
CREATE INDEX IF NOT EXISTS idx_clientes_asaas_id ON clientes(asaas_id);
