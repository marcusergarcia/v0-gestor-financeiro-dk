-- Adicionar colunas para controle de aviso de inatividade
ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS warning_sent_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Índice para otimizar busca por sessões inativas
CREATE INDEX IF NOT EXISTS idx_last_activity 
ON whatsapp_conversations(phone_number, last_activity_at, status);
