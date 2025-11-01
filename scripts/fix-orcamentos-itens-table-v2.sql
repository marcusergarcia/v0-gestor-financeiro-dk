-- Script para corrigir a tabela orcamentos_itens removendo constraints problemáticas
-- e recriando com a estrutura correta

-- Primeiro, vamos verificar as constraints existentes
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'orcamentos_itens' 
AND TABLE_SCHEMA = DATABASE();

-- Remover todas as constraints de chave estrangeira da tabela orcamentos_itens
SET FOREIGN_KEY_CHECKS = 0;

-- Dropar constraints existentes (se existirem)
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS fk_orcamento_itens_orcamento;
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS fk_orcamento_itens_produto;
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS orcamentos_itens_ibfk_1;
ALTER TABLE orcamentos_itens DROP FOREIGN KEY IF EXISTS orcamentos_itens_ibfk_2;

-- Dropar índices existentes
ALTER TABLE orcamentos_itens DROP INDEX IF EXISTS idx_orcamento_id;
ALTER TABLE orcamentos_itens DROP INDEX IF EXISTS idx_produto_id;
ALTER TABLE orcamentos_itens DROP INDEX IF EXISTS fk_orcamento_itens_orcamento;
ALTER TABLE orcamentos_itens DROP INDEX IF EXISTS fk_orcamento_itens_produto;

-- Recriar a tabela com a estrutura correta
DROP TABLE IF EXISTS orcamentos_itens_backup;
CREATE TABLE orcamentos_itens_backup AS SELECT * FROM orcamentos_itens;

DROP TABLE orcamentos_itens;

CREATE TABLE orcamentos_itens (
    id VARCHAR(36) PRIMARY KEY,
    orcamento_numero VARCHAR(20) NOT NULL,
    produto_id VARCHAR(36) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_mao_obra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    marca_nome VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_orcamento_numero (orcamento_numero),
    INDEX idx_produto_id (produto_id),
    
    FOREIGN KEY (orcamento_numero) REFERENCES orcamentos(numero) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restaurar dados se existirem na tabela de backup
INSERT INTO orcamentos_itens (
    id, orcamento_numero, produto_id, quantidade, 
    valor_unitario, valor_mao_obra, valor_total, marca_nome, created_at, updated_at
)
SELECT 
    COALESCE(id, UUID()) as id,
    orcamento_numero,
    produto_id,
    COALESCE(quantidade, 1) as quantidade,
    COALESCE(valor_unitario, 0.00) as valor_unitario,
    COALESCE(valor_mao_obra, 0.00) as valor_mao_obra,
    COALESCE(valor_total, 0.00) as valor_total,
    marca_nome,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM orcamentos_itens_backup
WHERE orcamento_numero IN (SELECT numero FROM orcamentos)
AND produto_id IN (SELECT id FROM produtos);

-- Reativar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar se tudo está funcionando
SELECT COUNT(*) as total_itens FROM orcamentos_itens;
SELECT COUNT(*) as total_orcamentos FROM orcamentos;

-- Limpar tabela de backup após confirmação
-- DROP TABLE orcamentos_itens_backup;

SELECT 'Tabela orcamentos_itens corrigida com sucesso!' as status;
