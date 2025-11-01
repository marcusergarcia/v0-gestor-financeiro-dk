-- Script para corrigir a estrutura da tabela contratos_conservacao
-- Adicionar campos faltantes, chaves primárias, estrangeiras e relacionamentos

USE gestor_financeiro;

-- 1. Verificar e corrigir a estrutura básica da tabela
ALTER TABLE contratos_conservacao 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY,
MODIFY COLUMN numero VARCHAR(50) NOT NULL UNIQUE,
MODIFY COLUMN cliente_id INT NOT NULL,
MODIFY COLUMN proposta_id INT NULL,
MODIFY COLUMN data_proposta DATE NOT NULL,
MODIFY COLUMN quantidade_visitas INT NOT NULL DEFAULT 1,
MODIFY COLUMN data_inicio DATE NOT NULL,
MODIFY COLUMN data_fim DATE NOT NULL,
MODIFY COLUMN valor_mensal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
MODIFY COLUMN frequencia ENUM('quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral') NOT NULL DEFAULT 'mensal',
MODIFY COLUMN dia_vencimento INT NOT NULL DEFAULT 10,
MODIFY COLUMN forma_pagamento VARCHAR(100) NULL,
MODIFY COLUMN equipamentos_inclusos LONGTEXT NULL,
MODIFY COLUMN servicos_inclusos TEXT NULL,
MODIFY COLUMN observacoes TEXT NULL,
MODIFY COLUMN conteudo_contrato LONGTEXT NULL,
MODIFY COLUMN status ENUM('ativo', 'suspenso', 'cancelado', 'finalizado') NOT NULL DEFAULT 'ativo',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
MODIFY COLUMN prazo_meses INT NOT NULL DEFAULT 12,
MODIFY COLUMN desconto_quant_visitas DECIMAL(5,2) DEFAULT 0.00;

-- 2. Adicionar campos que podem estar faltando
ALTER TABLE contratos_conservacao 
ADD COLUMN IF NOT EXISTS valor_total DECIMAL(12,2) GENERATED ALWAYS AS (valor_mensal * prazo_meses) STORED,
ADD COLUMN IF NOT EXISTS valor_desconto DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_final DECIMAL(12,2) GENERATED ALWAYS AS ((valor_mensal * prazo_meses) - IFNULL(valor_desconto, 0)) STORED,
ADD COLUMN IF NOT EXISTS responsavel_tecnico VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS telefone_emergencia VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS email_notificacao VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS proxima_visita DATE NULL,
ADD COLUMN IF NOT EXISTS ultima_visita DATE NULL,
ADD COLUMN IF NOT EXISTS renovacao_automatica BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS clausulas_especiais TEXT NULL,
ADD COLUMN IF NOT EXISTS anexos JSON NULL;

-- 3. Remover índices duplicados mencionados no phpMyAdmin
DROP INDEX IF EXISTS idx_contratos_proposta ON contratos_conservacao;
DROP INDEX IF EXISTS idx_contratos_status ON contratos_conservacao;
DROP INDEX IF EXISTS idx_contratos_cliente ON contratos_conservacao;

-- 4. Criar índices otimizados
CREATE INDEX idx_cliente_id ON contratos_conservacao(cliente_id);
CREATE INDEX idx_proposta_id ON contratos_conservacao(proposta_id);
CREATE INDEX idx_status ON contratos_conservacao(status);
CREATE INDEX idx_data_inicio ON contratos_conservacao(data_inicio);
CREATE INDEX idx_data_fim ON contratos_conservacao(data_fim);
CREATE INDEX idx_proxima_visita ON contratos_conservacao(proxima_visita);
CREATE INDEX idx_numero ON contratos_conservacao(numero);
CREATE INDEX idx_created_at ON contratos_conservacao(created_at);

-- 5. Adicionar chaves estrangeiras
ALTER TABLE contratos_conservacao
ADD CONSTRAINT fk_contratos_conservacao_cliente 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE contratos_conservacao
ADD CONSTRAINT fk_contratos_conservacao_proposta 
    FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Criar tabela para histórico de visitas técnicas
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
    
    FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_contrato_id (contrato_id),
    INDEX idx_data_visita (data_visita),
    INDEX idx_status (status),
    INDEX idx_tecnico (tecnico_responsavel)
);

-- 7. Criar tabela para equipamentos do contrato
CREATE TABLE IF NOT EXISTS contratos_conservacao_equipamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    UNIQUE KEY unique_contrato_equipamento (contrato_id, equipamento_id),
    INDEX idx_contrato_id (contrato_id),
    INDEX idx_equipamento_id (equipamento_id)
);

-- 8. Criar tabela para renovações de contrato
CREATE TABLE IF NOT EXISTS contratos_conservacao_renovacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contrato_original_id INT NOT NULL,
    contrato_renovado_id INT NOT NULL,
    data_renovacao DATE NOT NULL,
    motivo TEXT NULL,
    alteracoes_realizadas TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contrato_original_id) REFERENCES contratos_conservacao(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (contrato_renovado_id) REFERENCES contratos_conservacao(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_contrato_original (contrato_original_id),
    INDEX idx_contrato_renovado (contrato_renovado_id),
    INDEX idx_data_renovacao (data_renovacao)
);

-- 9. Criar triggers para atualizar campos automáticos
DELIMITER //

CREATE TRIGGER IF NOT EXISTS tr_contratos_conservacao_proxima_visita
AFTER INSERT ON contratos_conservacao
FOR EACH ROW
BEGIN
    DECLARE proxima DATE;
    
    -- Calcular próxima visita baseada na frequência
    CASE NEW.frequencia
        WHEN 'quinzenal' THEN SET proxima = DATE_ADD(NEW.data_inicio, INTERVAL 15 DAY);
        WHEN 'mensal' THEN SET proxima = DATE_ADD(NEW.data_inicio, INTERVAL 1 MONTH);
        WHEN 'bimestral' THEN SET proxima = DATE_ADD(NEW.data_inicio, INTERVAL 2 MONTH);
        WHEN 'trimestral' THEN SET proxima = DATE_ADD(NEW.data_inicio, INTERVAL 3 MONTH);
        WHEN 'semestral' THEN SET proxima = DATE_ADD(NEW.data_inicio, INTERVAL 6 MONTH);
        ELSE SET proxima = DATE_ADD(NEW.data_inicio, INTERVAL 1 MONTH);
    END CASE;
    
    UPDATE contratos_conservacao 
    SET proxima_visita = proxima 
    WHERE id = NEW.id;
END//

CREATE TRIGGER IF NOT EXISTS tr_contratos_conservacao_update_proxima_visita
AFTER UPDATE ON contratos_conservacao_visitas
FOR EACH ROW
BEGIN
    DECLARE proxima DATE;
    DECLARE freq VARCHAR(20);
    
    IF NEW.status = 'realizada' THEN
        -- Buscar frequência do contrato
        SELECT frequencia INTO freq 
        FROM contratos_conservacao 
        WHERE id = NEW.contrato_id;
        
        -- Calcular próxima visita
        CASE freq
            WHEN 'quinzenal' THEN SET proxima = DATE_ADD(NEW.data_visita, INTERVAL 15 DAY);
            WHEN 'mensal' THEN SET proxima = DATE_ADD(NEW.data_visita, INTERVAL 1 MONTH);
            WHEN 'bimestral' THEN SET proxima = DATE_ADD(NEW.data_visita, INTERVAL 2 MONTH);
            WHEN 'trimestral' THEN SET proxima = DATE_ADD(NEW.data_visita, INTERVAL 3 MONTH);
            WHEN 'semestral' THEN SET proxima = DATE_ADD(NEW.data_visita, INTERVAL 6 MONTH);
            ELSE SET proxima = DATE_ADD(NEW.data_visita, INTERVAL 1 MONTH);
        END CASE;
        
        -- Atualizar contrato
        UPDATE contratos_conservacao 
        SET ultima_visita = NEW.data_visita,
            proxima_visita = proxima
        WHERE id = NEW.contrato_id;
    END IF;
END//

DELIMITER ;

-- 10. Criar views úteis
CREATE OR REPLACE VIEW vw_contratos_ativos AS
SELECT 
    cc.*,
    c.nome as cliente_nome,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    DATEDIFF(cc.data_fim, CURDATE()) as dias_restantes,
    CASE 
        WHEN cc.proxima_visita < CURDATE() THEN 'ATRASADA'
        WHEN cc.proxima_visita = CURDATE() THEN 'HOJE'
        WHEN cc.proxima_visita <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'PROXIMA_SEMANA'
        ELSE 'AGENDADA'
    END as status_proxima_visita
FROM contratos_conservacao cc
JOIN clientes c ON cc.cliente_id = c.id
WHERE cc.status = 'ativo'
AND cc.data_fim >= CURDATE();

CREATE OR REPLACE VIEW vw_visitas_pendentes AS
SELECT 
    cc.id as contrato_id,
    cc.numero as contrato_numero,
    c.nome as cliente_nome,
    cc.proxima_visita,
    cc.frequencia,
    cc.responsavel_tecnico,
    DATEDIFF(cc.proxima_visita, CURDATE()) as dias_para_visita
FROM contratos_conservacao cc
JOIN clientes c ON cc.cliente_id = c.id
WHERE cc.status = 'ativo'
AND cc.proxima_visita IS NOT NULL
AND cc.proxima_visita <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY cc.proxima_visita ASC;

-- 11. Inserir dados de exemplo se necessário
INSERT IGNORE INTO contratos_conservacao 
(numero, cliente_id, data_proposta, quantidade_visitas, data_inicio, data_fim, valor_mensal, frequencia, dia_vencimento, status, prazo_meses)
SELECT 
    CONCAT('CONS-', LPAD(ROW_NUMBER() OVER (ORDER BY id), 6, '0')) as numero,
    id as cliente_id,
    CURDATE() as data_proposta,
    12 as quantidade_visitas,
    CURDATE() as data_inicio,
    DATE_ADD(CURDATE(), INTERVAL 12 MONTH) as data_fim,
    500.00 as valor_mensal,
    'mensal' as frequencia,
    10 as dia_vencimento,
    'ativo' as status,
    12 as prazo_meses
FROM clientes 
WHERE tem_contrato = 1 
AND id NOT IN (SELECT DISTINCT cliente_id FROM contratos_conservacao WHERE cliente_id IS NOT NULL)
LIMIT 5;

-- 12. Verificar integridade dos dados
SELECT 'Verificação concluída' as status,
       COUNT(*) as total_contratos,
       COUNT(CASE WHEN status = 'ativo' THEN 1 END) as contratos_ativos,
       COUNT(CASE WHEN proxima_visita IS NOT NULL THEN 1 END) as com_proxima_visita
FROM contratos_conservacao;
