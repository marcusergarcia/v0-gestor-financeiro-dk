-- Migrar dados da tabela configuracao_equipamentos para equipamentos (se existir)
INSERT IGNORE INTO equipamentos (nome, categoria, valor_hora, descricao, ativo, created_at, updated_at)
SELECT 
    nome,
    categoria,
    valor_hora,
    descricao,
    ativo,
    COALESCE(data_criacao, NOW()) as created_at,
    COALESCE(data_atualizacao, NOW()) as updated_at
FROM configuracao_equipamentos
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracao_equipamentos');

-- Remover a tabela configuracao_equipamentos se existir
DROP TABLE IF EXISTS configuracao_equipamentos;

-- Verificar se a tabela equipamentos tem a estrutura correta
-- Se não tiver as colunas necessárias, criar elas
ALTER TABLE equipamentos 
ADD COLUMN IF NOT EXISTS categoria ENUM('basicos', 'portoes_veiculos', 'portoes_pedestre', 'software_redes') DEFAULT 'basicos',
ADD COLUMN IF NOT EXISTS descricao TEXT NULL,
ADD COLUMN IF NOT EXISTS ativo TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Atualizar equipamentos existentes que não tenham categoria definida
UPDATE equipamentos SET categoria = 'basicos' WHERE categoria IS NULL OR categoria = '';

-- Atualizar equipamentos existentes que não tenham ativo definido
UPDATE equipamentos SET ativo = 1 WHERE ativo IS NULL;
