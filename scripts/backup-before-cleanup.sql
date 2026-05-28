-- Script de backup antes de remover os campos
-- Execute este script antes de executar o remove-obsolete-fields.sql

-- Criar uma tabela de backup com os dados atuais
CREATE TABLE orcamentos_backup_before_cleanup AS 
SELECT * FROM orcamentos;

-- Verificar se o backup foi criado corretamente
SELECT COUNT(*) as registros_backup FROM orcamentos_backup_before_cleanup;
SELECT COUNT(*) as registros_original FROM orcamentos;

-- Mostrar a estrutura da tabela de backup
DESCRIBE orcamentos_backup_before_cleanup;
