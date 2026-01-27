-- Script para limpar campos das integrações antigas (PagBank/MercadoPago) da tabela boletos
-- Mantendo apenas os campos do Asaas

-- ATENÇÃO: Este script vai:
-- 1. Remover as colunas antigas do PagBank/MercadoPago
-- 2. Manter apenas os campos do Asaas

-- Backup dos dados antes de executar (recomendado fazer backup completo do banco)

-- Remover colunas do PagBank/MercadoPago
ALTER TABLE boletos 
  DROP COLUMN IF EXISTS charge_id,
  DROP COLUMN IF EXISTS order_id,
  DROP COLUMN IF EXISTS notification_url;

-- Renomear campos do Asaas para nomes simples (se ainda não estiverem renomeados)
-- Primeiro verificar se os campos asaas_* existem

-- Atualizar os campos linha_digitavel e codigo_barras para usar apenas os do Asaas
-- (esses campos serão mantidos como campos genéricos que o Asaas vai preencher)

-- Adicionar campo gateway se não existir (para identificar qual gateway gerou o boleto)
-- ALTER TABLE boletos ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT NULL;

-- Limpar valores antigos de gateway que não sejam 'asaas'
UPDATE boletos SET gateway = NULL WHERE gateway = 'pagbank';

-- Verificar estrutura final da tabela
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'boletos';
