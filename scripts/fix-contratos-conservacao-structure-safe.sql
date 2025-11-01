-- Script para corrigir a estrutura da tabela contratos_conservacao
-- Versão segura sem comando USE e com verificações

-- 1. Verificar se a tabela existe antes de modificar
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_name = 'contratos_conservacao' 
                    AND table_schema = DATABASE());

-- 2. Corrigir estrutura básica da tabela apenas se ela existir
SET @sql = IF(@table_exists > 0, 
    'ALTER TABLE contratos_conservacao 
    MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY,
    MODIFY COLUMN numero VARCHAR(50) NOT NULL,
    MODIFY COLUMN cliente_id INT NOT NULL,
    MODIFY COLUMN proposta_id INT NULL,
    MODIFY COLUMN data_proposta DATE NOT NULL,
    MODIFY COLUMN quantidade_visitas INT NOT NULL DEFAULT 1,
    MODIFY COLUMN data_inicio DATE NOT NULL,
    MODIFY COLUMN data_fim DATE NOT NULL,
    MODIFY COLUMN valor_mensal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    MODIFY COLUMN frequencia ENUM(\'quinzenal\', \'mensal\', \'bimestral\', \'trimestral\', \'semestral\') NOT NULL DEFAULT \'mensal\',
    MODIFY COLUMN dia_vencimento INT NOT NULL DEFAULT 10,
    MODIFY COLUMN forma_pagamento VARCHAR(100) NULL,
    MODIFY COLUMN equipamentos_inclusos LONGTEXT NULL,
    MODIFY COLUMN servicos_inclusos TEXT NULL,
    MODIFY COLUMN observacoes TEXT NULL,
    MODIFY COLUMN conteudo_contrato LONGTEXT NULL,
    MODIFY COLUMN status ENUM(\'ativo\', \'suspenso\', \'cancelado\', \'finalizado\') NOT NULL DEFAULT \'ativo\',
    MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFY COLUMN prazo_meses INT NOT NULL DEFAULT 12,
    MODIFY COLUMN desconto_quant_visitas DECIMAL(5,2) DEFAULT 0.00',
    'SELECT "Tabela contratos_conservacao não encontrada" as erro');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Adicionar campos que podem estar faltando
SET @sql = IF(@table_exists > 0,
    'ALTER TABLE contratos_conservacao 
    ADD COLUMN valor_desconto DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN responsavel_tecnico VARCHAR(255) NULL,
    ADD COLUMN telefone_emergencia VARCHAR(20) NULL,
    ADD COLUMN email_notificacao VARCHAR(255) NULL,
    ADD COLUMN proxima_visita DATE NULL,
    ADD COLUMN ultima_visita DATE NULL,
    ADD COLUMN renovacao_automatica BOOLEAN DEFAULT FALSE,
    ADD COLUMN clausulas_especiais TEXT NULL',
    'SELECT "Pulando adição de campos" as info');

-- Executar apenas se não houver erro
SET @continue = 1;
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 4. Criar índice único para numero se não existir
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                    WHERE table_name = 'contratos_conservacao' 
                    AND index_name = 'idx_numero_unique'
                    AND table_schema = DATABASE());

SET @sql = IF(@index_exists = 0 AND @table_exists > 0,
    'CREATE UNIQUE INDEX idx_numero_unique ON contratos_conservacao(numero)',
    'SELECT "Índice único já existe ou tabela não encontrada" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 5. Criar outros índices necessários
SET @sql = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_cliente_id ON contratos_conservacao(cliente_id)',
    'SELECT "Pulando criação de índices" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

SET @sql = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_proposta_id ON contratos_conservacao(proposta_id)',
    'SELECT "Pulando criação de índices" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

SET @sql = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_status ON contratos_conservacao(status)',
    'SELECT "Pulando criação de índices" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

SET @sql = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_data_inicio ON contratos_conservacao(data_inicio)',
    'SELECT "Pulando criação de índices" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

SET @sql = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_proxima_visita ON contratos_conservacao(proxima_visita)',
    'SELECT "Pulando criação de índices" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 6. Verificar se as tabelas relacionadas existem antes de criar foreign keys
SET @clientes_exists = (SELECT COUNT(*) FROM information_schema.tables 
                       WHERE table_name = 'clientes' 
                       AND table_schema = DATABASE());

SET @proposta_exists = (SELECT COUNT(*) FROM information_schema.tables 
                       WHERE table_name = 'proposta_contratos' 
                       AND table_schema = DATABASE());

-- 7. Criar foreign key para clientes se ambas tabelas existirem
SET @fk_cliente_exists = (SELECT COUNT(*) FROM information_schema.key_column_usage 
                         WHERE constraint_name = 'fk_contratos_conservacao_cliente'
                         AND table_schema = DATABASE());

SET @sql = IF(@clientes_exists > 0 AND @table_exists > 0 AND @fk_cliente_exists = 0,
    'ALTER TABLE contratos_conservacao
    ADD CONSTRAINT fk_contratos_conservacao_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "Foreign key cliente já existe ou tabelas não encontradas" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 8. Criar foreign key para proposta se ambas tabelas existirem
SET @fk_proposta_exists = (SELECT COUNT(*) FROM information_schema.key_column_usage 
                          WHERE constraint_name = 'fk_contratos_conservacao_proposta'
                          AND table_schema = DATABASE());

SET @sql = IF(@proposta_exists > 0 AND @table_exists > 0 AND @fk_proposta_exists = 0,
    'ALTER TABLE contratos_conservacao
    ADD CONSTRAINT fk_contratos_conservacao_proposta 
        FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "Foreign key proposta já existe ou tabelas não encontradas" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 9. Criar tabela para histórico de visitas técnicas
CREATE TABLE IF NOT EXISTS contratos_conservacao_visitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    data_visita DATE NOT NULL,
    hora_inicio TIME NULL,
    hora_fim TIME NULL,
    tecnico_responsavel VARCHAR(255) NULL,
    servicos_realizados TEXT NULL,
    observacoes TEXT NULL,
    status ENUM('agendada', 'realizada', 'cancelada', 'reagendada') DEFAULT 'agendada',
    assinatura_cliente TEXT NULL,
    fotos JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_contrato_id (contrato_id),
    INDEX idx_data_visita (data_visita),
    INDEX idx_status (status),
    INDEX idx_tecnico (tecnico_responsavel)
);

-- 10. Adicionar foreign key para visitas se a tabela principal existir
SET @visitas_fk_exists = (SELECT COUNT(*) FROM information_schema.key_column_usage 
                         WHERE constraint_name = 'fk_visitas_contrato'
                         AND table_schema = DATABASE());

SET @sql = IF(@table_exists > 0 AND @visitas_fk_exists = 0,
    'ALTER TABLE contratos_conservacao_visitas
    ADD CONSTRAINT fk_visitas_contrato 
        FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) 
        ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "Foreign key visitas já existe ou tabela principal não encontrada" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 11. Verificar se equipamentos existe antes de criar tabela relacionada
SET @equipamentos_exists = (SELECT COUNT(*) FROM information_schema.tables 
                           WHERE table_name = 'equipamentos' 
                           AND table_schema = DATABASE());

-- 12. Criar tabela para equipamentos do contrato
CREATE TABLE IF NOT EXISTS contratos_conservacao_equipamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_contrato_id (contrato_id),
    INDEX idx_equipamento_id (equipamento_id)
);

-- 13. Adicionar foreign keys para equipamentos
SET @equip_contrato_fk_exists = (SELECT COUNT(*) FROM information_schema.key_column_usage 
                                WHERE constraint_name = 'fk_contrato_equipamentos_contrato'
                                AND table_schema = DATABASE());

SET @sql = IF(@table_exists > 0 AND @equip_contrato_fk_exists = 0,
    'ALTER TABLE contratos_conservacao_equipamentos
    ADD CONSTRAINT fk_contrato_equipamentos_contrato 
        FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) 
        ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "Foreign key contrato equipamentos já existe" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

SET @equip_fk_exists = (SELECT COUNT(*) FROM information_schema.key_column_usage 
                       WHERE constraint_name = 'fk_contrato_equipamentos_equipamento'
                       AND table_schema = DATABASE());

SET @sql = IF(@equipamentos_exists > 0 AND @equip_fk_exists = 0,
    'ALTER TABLE contratos_conservacao_equipamentos
    ADD CONSTRAINT fk_contrato_equipamentos_equipamento 
        FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "Foreign key equipamentos já existe ou tabela não encontrada" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 14. Adicionar constraint unique para evitar duplicatas
SET @unique_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
                     WHERE constraint_name = 'unique_contrato_equipamento'
                     AND table_schema = DATABASE());

SET @sql = IF(@unique_exists = 0,
    'ALTER TABLE contratos_conservacao_equipamentos
    ADD CONSTRAINT unique_contrato_equipamento UNIQUE (contrato_id, equipamento_id)',
    'SELECT "Constraint unique já existe" as info');

BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @continue = 0;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- 15. Verificação final
SELECT 
    'Script executado com sucesso' as status,
    (SELECT COUNT(*) FROM contratos_conservacao) as total_contratos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_name = 'contratos_conservacao_visitas' 
     AND table_schema = DATABASE()) as tabela_visitas_criada,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_name = 'contratos_conservacao_equipamentos' 
     AND table_schema = DATABASE()) as tabela_equipamentos_criada;
