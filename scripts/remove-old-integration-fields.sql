-- =================================================================
-- Script para remover campos das integrações antigas
-- (PagBank, PagSeguro, Mercado Pago)
-- =================================================================
-- IMPORTANTE: Faça backup do banco de dados antes de executar!
-- =================================================================
-- INSTRUCOES:
-- 1. Execute cada comando SEPARADAMENTE no phpMyAdmin
-- 2. Se aparecer erro "Can't DROP; check column/key exists"
--    significa que a coluna já foi removida - IGNORE e continue
-- =================================================================

-- PASSO 1: Remover campos antigos (execute um por vez)

-- 1. Remover charge_id (PagBank)
ALTER TABLE boletos DROP COLUMN charge_id;

-- 2. Remover order_id (PagBank)
ALTER TABLE boletos DROP COLUMN order_id;

-- 3. Remover linha_digitavel (agora usa asaas_linha_digitavel)
ALTER TABLE boletos DROP COLUMN linha_digitavel;

-- 4. Remover codigo_barras (agora usa asaas_barcode)
ALTER TABLE boletos DROP COLUMN codigo_barras;

-- 5. Remover link_pdf (agora usa asaas_bankslip_url)
ALTER TABLE boletos DROP COLUMN link_pdf;

-- 6. Remover link_impressao (agora usa asaas_invoice_url)
ALTER TABLE boletos DROP COLUMN link_impressao;

-- 7. Remover qr_code (nao utilizado)
ALTER TABLE boletos DROP COLUMN qr_code;

-- 8. Remover webhook_notificado
ALTER TABLE boletos DROP COLUMN webhook_notificado;

-- 9. Remover notificacao_3dias_enviada
ALTER TABLE boletos DROP COLUMN notificacao_3dias_enviada;

-- 10. Remover notificacao_hoje_enviada
ALTER TABLE boletos DROP COLUMN notificacao_hoje_enviada;

-- 11. Remover notificacao_vencido_enviada
ALTER TABLE boletos DROP COLUMN notificacao_vencido_enviada;

-- 12. Remover notification_urls (PagBank)
ALTER TABLE boletos DROP COLUMN notification_urls;

-- 13. Remover descricao_produto
ALTER TABLE boletos DROP COLUMN descricao_produto;

-- =================================================================
-- PASSO 2: Verificar estrutura final
-- =================================================================
DESCRIBE boletos;

-- =================================================================
-- Campos que PERMANECEM para o Asaas:
-- asaas_id, asaas_customer_id, asaas_invoice_url,
-- asaas_bankslip_url, asaas_barcode, asaas_linha_digitavel,
-- asaas_nosso_numero, gateway
-- =================================================================
