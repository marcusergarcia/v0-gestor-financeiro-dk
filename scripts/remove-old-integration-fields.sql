-- Script para remover campos das integrações antigas (PagBank, PagSeguro, Mercado Pago)
-- Esses campos não são mais utilizados, pois agora usamos apenas o Asaas
-- Data: 2024
-- IMPORTANTE: Faça backup do banco de dados antes de executar este script

-- Campos a serem removidos da tabela boletos:
-- charge_id - ID da cobrança no PagBank (CHAR_XXXX)
-- order_id - ID do pedido no PagBank (ORDE_XXXX)
-- linha_digitavel - Linha digitável antiga (agora usa asaas_linha_digitavel)
-- codigo_barras - Código de barras antigo (agora usa asaas_barcode)
-- link_pdf - Link do PDF antigo (agora usa asaas_bankslip_url)
-- link_impressao - Link de impressão antigo (agora usa asaas_bankslip_url)
-- qr_code - QR Code antigo (não utilizado mais)
-- webhook_notificado - Flag de webhook antigo (não necessário)
-- notificacao_3dias_enviada - Flag de notificação antiga
-- notificacao_hoje_enviada - Flag de notificação antiga
-- notificacao_vencido_enviada - Flag de notificação antiga
-- notification_urls - URLs de webhook do PagBank
-- descricao_produto - Descrição do produto para PagBank (não mais necessário)

-- =================================================================
-- PASSO 1: Verificar se os campos existem antes de remover
-- =================================================================

-- Verificar estrutura atual da tabela
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'boletos'
AND COLUMN_NAME IN (
    'charge_id',
    'order_id', 
    'linha_digitavel',
    'codigo_barras',
    'link_pdf',
    'link_impressao',
    'qr_code',
    'webhook_notificado',
    'notificacao_3dias_enviada',
    'notificacao_hoje_enviada',
    'notificacao_vencido_enviada',
    'notification_urls',
    'descricao_produto'
);

-- =================================================================
-- PASSO 2: Remover os campos antigos
-- =================================================================

-- Remover charge_id (PagBank)
ALTER TABLE boletos DROP COLUMN IF EXISTS charge_id;

-- Remover order_id (PagBank)
ALTER TABLE boletos DROP COLUMN IF EXISTS order_id;

-- Remover linha_digitavel (antigo - agora usa asaas_linha_digitavel)
ALTER TABLE boletos DROP COLUMN IF EXISTS linha_digitavel;

-- Remover codigo_barras (antigo - agora usa asaas_barcode)
ALTER TABLE boletos DROP COLUMN IF EXISTS codigo_barras;

-- Remover link_pdf (antigo - agora usa asaas_bankslip_url)
ALTER TABLE boletos DROP COLUMN IF EXISTS link_pdf;

-- Remover link_impressao (antigo - agora usa asaas_bankslip_url)
ALTER TABLE boletos DROP COLUMN IF EXISTS link_impressao;

-- Remover qr_code (não utilizado mais)
ALTER TABLE boletos DROP COLUMN IF EXISTS qr_code;

-- Remover webhook_notificado (antigo)
ALTER TABLE boletos DROP COLUMN IF EXISTS webhook_notificado;

-- Remover notificacao_3dias_enviada (antigo)
ALTER TABLE boletos DROP COLUMN IF EXISTS notificacao_3dias_enviada;

-- Remover notificacao_hoje_enviada (antigo)
ALTER TABLE boletos DROP COLUMN IF EXISTS notificacao_hoje_enviada;

-- Remover notificacao_vencido_enviada (antigo)
ALTER TABLE boletos DROP COLUMN IF EXISTS notificacao_vencido_enviada;

-- Remover notification_urls (PagBank)
ALTER TABLE boletos DROP COLUMN IF EXISTS notification_urls;

-- Remover descricao_produto (PagBank)
ALTER TABLE boletos DROP COLUMN IF EXISTS descricao_produto;

-- =================================================================
-- PASSO 3: Remover índices antigos relacionados (se existirem)
-- =================================================================

-- Verificar e remover índices antigos
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'boletos' AND INDEX_NAME = 'idx_charge_id');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE boletos DROP INDEX idx_charge_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'boletos' AND INDEX_NAME = 'idx_order_id');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE boletos DROP INDEX idx_order_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =================================================================
-- PASSO 4: Verificar estrutura final
-- =================================================================

-- Mostrar estrutura final da tabela
DESCRIBE boletos;

-- Campos que DEVEM permanecer para o Asaas:
-- asaas_id - ID do pagamento no Asaas
-- asaas_customer_id - ID do cliente no Asaas
-- asaas_invoice_url - URL da fatura do Asaas
-- asaas_bankslip_url - URL do PDF do boleto do Asaas
-- asaas_barcode - Código de barras do Asaas
-- asaas_linha_digitavel - Linha digitável do Asaas
-- asaas_nosso_numero - Nosso número do Asaas
-- gateway - Gateway utilizado (asaas)

SELECT 'Limpeza concluída! Os campos antigos das integrações PagBank/PagSeguro/MercadoPago foram removidos.' AS mensagem;
