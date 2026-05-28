-- Adicionar campo para rastrear o ultimo numero de NFS-e conhecido
ALTER TABLE nfse_config
  ADD COLUMN ultima_nfse_numero INT DEFAULT 0 COMMENT 'Ultimo numero de NFS-e conhecido (referencia para o sistema)';
