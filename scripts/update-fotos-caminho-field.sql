-- Atualizar o campo caminho_arquivo para suportar base64
-- Este script altera o tipo da coluna para LONGTEXT para armazenar imagens em base64

USE u880459407_gestorFinanc;

-- Verificar a estrutura atual da tabela
DESCRIBE ordens_servico_fotos;

-- Alterar o campo caminho_arquivo para LONGTEXT
ALTER TABLE ordens_servico_fotos 
MODIFY COLUMN caminho_arquivo LONGTEXT NOT NULL 
COMMENT 'Caminho do arquivo (URL ou data URI base64)';

-- Verificar a nova estrutura
DESCRIBE ordens_servico_fotos;

-- Mostrar uma mensagem de sucesso
SELECT 'Campo caminho_arquivo atualizado com sucesso para LONGTEXT' AS Status;
