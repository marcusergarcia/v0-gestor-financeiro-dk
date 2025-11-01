-- Adicionar colunas de margem de conteúdo na tabela layout_impressao_config
ALTER TABLE layout_impressao_config
ADD COLUMN content_margin_top INT DEFAULT 8 AFTER margin_bottom,
ADD COLUMN content_margin_bottom INT DEFAULT 8 AFTER content_margin_top;

-- Atualizar registros existentes com valores padrão
UPDATE layout_impressao_config 
SET content_margin_top = 8, content_margin_bottom = 8 
WHERE content_margin_top IS NULL OR content_margin_bottom IS NULL;
