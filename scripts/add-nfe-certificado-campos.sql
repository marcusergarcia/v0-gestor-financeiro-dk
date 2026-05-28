-- Adicionar campos de certificado digital proprio na tabela nfe_config
-- Isso permite que a NF-e tenha seu proprio certificado, sem depender da NFS-e

ALTER TABLE nfe_config
  ADD COLUMN IF NOT EXISTS certificado_base64 LONGTEXT DEFAULT NULL COMMENT 'Certificado digital A1 em base64',
  ADD COLUMN IF NOT EXISTS certificado_senha VARCHAR(255) DEFAULT NULL COMMENT 'Senha do certificado digital',
  ADD COLUMN IF NOT EXISTS certificado_validade VARCHAR(50) DEFAULT NULL COMMENT 'Data de validade do certificado';
