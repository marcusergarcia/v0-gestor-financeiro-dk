-- Adicionar campos para integração com Asaas na tabela boletos
-- Execute este script antes de usar a integração Asaas

-- Adicionar campos Asaas
ALTER TABLE boletos
ADD COLUMN asaas_id VARCHAR(100) NULL COMMENT 'ID da cobrança no Asaas (pay_xxxx)',
ADD COLUMN asaas_customer_id VARCHAR(100) NULL COMMENT 'ID do cliente no Asaas (cus_xxxx)',
ADD COLUMN asaas_url VARCHAR(500) NULL COMMENT 'URL do boleto no Asaas',
ADD COLUMN asaas_bank_slip_url VARCHAR(500) NULL COMMENT 'URL do PDF do boleto no Asaas',
ADD COLUMN gateway VARCHAR(20) DEFAULT NULL COMMENT 'Gateway utilizado: pagbank ou asaas';

-- Índices para busca
CREATE INDEX idx_boletos_asaas_id ON boletos(asaas_id);
CREATE INDEX idx_boletos_gateway ON boletos(gateway);
