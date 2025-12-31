-- Adicionar campos de controle de notificações na tabela boletos
ALTER TABLE boletos 
ADD COLUMN IF NOT EXISTS notificacao_3dias_enviada TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notificacao_hoje_enviada TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notificacao_vencido_enviada TINYINT(1) DEFAULT 0;

-- Criar índices para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_boletos_vencimento_status 
ON boletos(data_vencimento, status);

CREATE INDEX IF NOT EXISTS idx_boletos_notificacoes 
ON boletos(notificacao_3dias_enviada, notificacao_hoje_enviada, notificacao_vencido_enviada);
