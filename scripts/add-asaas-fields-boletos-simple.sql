-- Script simples para adicionar campos Asaas na tabela boletos
-- Execute cada ALTER separadamente. Ignore erros de "Duplicate column name" se a coluna já existir.

-- Coluna para ID da cobrança no Asaas
ALTER TABLE boletos ADD COLUMN asaas_id VARCHAR(100) NULL COMMENT 'ID da cobrança no Asaas (pay_xxxx)';

-- Coluna para ID do cliente no Asaas  
ALTER TABLE boletos ADD COLUMN asaas_customer_id VARCHAR(100) NULL COMMENT 'ID do cliente no Asaas (cus_xxxx)';

-- Coluna para URL do boleto (invoice)
ALTER TABLE boletos ADD COLUMN asaas_url VARCHAR(500) NULL COMMENT 'URL do boleto no Asaas';

-- Coluna para URL do PDF do boleto
ALTER TABLE boletos ADD COLUMN asaas_bank_slip_url VARCHAR(500) NULL COMMENT 'URL do PDF do boleto no Asaas';

-- Coluna para linha digitável
ALTER TABLE boletos ADD COLUMN linha_digitavel VARCHAR(100) NULL COMMENT 'Linha digitável do boleto';

-- Coluna para código de barras
ALTER TABLE boletos ADD COLUMN codigo_barras VARCHAR(100) NULL COMMENT 'Código de barras do boleto';

-- Coluna para identificar o gateway utilizado
ALTER TABLE boletos ADD COLUMN gateway VARCHAR(20) DEFAULT NULL COMMENT 'Gateway utilizado: pagbank ou asaas';

-- Índices para otimizar buscas
CREATE INDEX idx_boletos_asaas_id ON boletos(asaas_id);
CREATE INDEX idx_boletos_gateway ON boletos(gateway);
