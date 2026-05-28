-- Backup da tabela atual
CREATE TABLE proposta_itens_backup AS SELECT * FROM proposta_itens;

-- Recriar tabela com estrutura correta
DROP TABLE IF EXISTS proposta_itens;

CREATE TABLE proposta_itens (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    proposta_id VARCHAR(50) NOT NULL,
    equipamento_id INT NOT NULL,
    categoria VARCHAR(100),
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_desconto_individual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_desconto_categoria DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_proposta_id (proposta_id),
    INDEX idx_equipamento_id (equipamento_id),
    INDEX idx_categoria (categoria)
);

-- Restaurar dados com novos UUIDs
INSERT INTO proposta_itens (
    id, proposta_id, equipamento_id, categoria, quantidade,
    valor_unitario, valor_desconto_individual, valor_desconto_categoria,
    valor_total, created_at, updated_at
)
SELECT 
    CONCAT(
        SUBSTRING(MD5(CONCAT(RAND(), NOW())), 1, 8), '-',
        SUBSTRING(MD5(CONCAT(RAND(), NOW())), 1, 4), '-',
        '4', SUBSTRING(MD5(CONCAT(RAND(), NOW())), 2, 3), '-',
        SUBSTRING('89ab', FLOOR(1 + RAND() * 4), 1), SUBSTRING(MD5(CONCAT(RAND(), NOW())), 2, 3), '-',
        SUBSTRING(MD5(CONCAT(RAND(), NOW())), 1, 12)
    ) as id,
    proposta_id,
    equipamento_id,
    categoria,
    quantidade,
    valor_unitario,
    valor_desconto_individual,
    valor_desconto_categoria,
    valor_total,
    created_at,
    updated_at
FROM proposta_itens_backup;

-- Verificar se os dados foram restaurados
SELECT COUNT(*) as total_registros FROM proposta_itens;
SELECT COUNT(*) as backup_registros FROM proposta_itens_backup;

-- Mostrar estrutura final
DESCRIBE proposta_itens;
