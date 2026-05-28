-- Fazer backup da tabela atual
DROP TABLE IF EXISTS proposta_itens_backup;
CREATE TABLE proposta_itens_backup AS SELECT * FROM proposta_itens;

-- Remover tabela atual
DROP TABLE IF EXISTS proposta_itens;

-- Recriar tabela com estrutura correta
CREATE TABLE proposta_itens (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    proposta_id VARCHAR(50) NOT NULL,
    equipamento_id INT NOT NULL,
    categoria VARCHAR(100) DEFAULT 'basicos',
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

-- Restaurar dados com novos UUIDs (se houver dados no backup)
INSERT INTO proposta_itens (
    id, proposta_id, equipamento_id, categoria, quantidade,
    valor_unitario, valor_desconto_individual, valor_desconto_categoria,
    valor_total, created_at, updated_at
)
SELECT 
    CONCAT(
        LPAD(HEX(FLOOR(RAND() * 4294967296)), 8, '0'), '-',
        LPAD(HEX(FLOOR(RAND() * 65536)), 4, '0'), '-',
        '4', LPAD(HEX(FLOOR(RAND() * 4096)), 3, '0'), '-',
        CONCAT(SUBSTRING('89ab', FLOOR(1 + RAND() * 4), 1), LPAD(HEX(FLOOR(RAND() * 4096)), 3, '0')), '-',
        LPAD(HEX(FLOOR(RAND() * 4294967296)), 8, '0'), LPAD(HEX(FLOOR(RAND() * 65536)), 4, '0')
    ) as id,
    proposta_id,
    equipamento_id,
    COALESCE(categoria, 'basicos') as categoria,
    COALESCE(quantidade, 1) as quantidade,
    COALESCE(valor_unitario, 0.00) as valor_unitario,
    COALESCE(valor_desconto_individual, 0.00) as valor_desconto_individual,
    COALESCE(valor_desconto_categoria, 0.00) as valor_desconto_categoria,
    COALESCE(valor_total, 0.00) as valor_total,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM proposta_itens_backup
WHERE proposta_id IS NOT NULL AND equipamento_id IS NOT NULL;

-- Verificar resultado
SELECT 'Tabela recriada com sucesso!' as status;
SELECT COUNT(*) as total_registros FROM proposta_itens;
DESCRIBE proposta_itens;
