-- Adicionar campos para controle de timeout de inatividade
ALTER TABLE whatsapp_conversations 
ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN timeout_warning_sent BOOLEAN DEFAULT FALSE,
ADD INDEX idx_last_activity (last_activity);
