-- Adiciona campo notification_urls para rastrear webhooks configurados
ALTER TABLE boletos 
ADD COLUMN notification_urls TEXT NULL COMMENT 'URL do webhook configurado no PagBank para receber notificações JSON da API v4';
