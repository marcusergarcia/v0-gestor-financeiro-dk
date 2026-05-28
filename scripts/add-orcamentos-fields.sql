-- Adicionar campos adicionais na tabela orcamentos se não existirem

-- Campos da área "Dados do Cliente"
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS distancia_km DECIMAL(10,2) DEFAULT 0 COMMENT 'Distância em Km (da tabela clientes)',
ADD COLUMN IF NOT EXISTS valor_boleto DECIMAL(10,2) DEFAULT 3.50 COMMENT 'Valor do Boleto',
ADD COLUMN IF NOT EXISTS prazo_dias INT DEFAULT 5 COMMENT 'Prazo em dias',
ADD COLUMN IF NOT EXISTS data_inicio DATE COMMENT 'Data de Início',
ADD COLUMN IF NOT EXISTS juros_am DECIMAL(5,2) DEFAULT 2.00 COMMENT 'Juros ao mês (%)',
ADD COLUMN IF NOT EXISTS imposto_servico DECIMAL(5,2) DEFAULT 10.90 COMMENT 'Imposto Serviço (%)',
ADD COLUMN IF NOT EXISTS imposto_material DECIMAL(5,2) DEFAULT 12.70 COMMENT 'Imposto Material (%)',
ADD COLUMN IF NOT EXISTS desconto_mdo_percent DECIMAL(5,2) DEFAULT 0 COMMENT 'Desconto MDO (%)';

-- Campos da área "Resumo do Orçamento"
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS parcelamento_mdo INT DEFAULT 1 COMMENT 'Parcelamento Mão de Obra',
ADD COLUMN IF NOT EXISTS parcelamento_material INT DEFAULT 1 COMMENT 'Parcelamento Material',
ADD COLUMN IF NOT EXISTS custo_deslocamento DECIMAL(10,2) DEFAULT 0 COMMENT 'Custo de Deslocamento',
ADD COLUMN IF NOT EXISTS valor_juros DECIMAL(10,2) DEFAULT 0 COMMENT 'Valor dos Juros',
ADD COLUMN IF NOT EXISTS taxa_boleto_mdo DECIMAL(10,2) DEFAULT 0 COMMENT 'Taxa Boleto Mão de Obra',
ADD COLUMN IF NOT EXISTS taxa_boleto_material DECIMAL(10,2) DEFAULT 0 COMMENT 'Taxa Boleto Material',
ADD COLUMN IF NOT EXISTS subtotal_mdo DECIMAL(10,2) DEFAULT 0 COMMENT 'Sub Total Mão de Obra',
ADD COLUMN IF NOT EXISTS subtotal_material DECIMAL(10,2) DEFAULT 0 COMMENT 'Sub Total Material',
ADD COLUMN IF NOT EXISTS desconto_mdo_valor DECIMAL(10,2) DEFAULT 0 COMMENT 'Desconto MDO em valor (R$)';

-- Adicionar índices para melhor performance
ALTER TABLE orcamentos 
ADD INDEX IF NOT EXISTS idx_data_inicio (data_inicio),
ADD INDEX IF NOT EXISTS idx_prazo_dias (prazo_dias);
