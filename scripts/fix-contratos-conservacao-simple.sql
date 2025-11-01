-- Script simplificado para corrigir contratos_conservacao
-- Execute comando por comando se necessário

-- 1. Adicionar campos faltantes um por vez
ALTER TABLE contratos_conservacao ADD COLUMN valor_desconto DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE contratos_conservacao ADD COLUMN responsavel_tecnico VARCHAR(255) NULL;
ALTER TABLE contratos_conservacao ADD COLUMN telefone_emergencia VARCHAR(20) NULL;
ALTER TABLE contratos_conservacao ADD COLUMN email_notificacao VARCHAR(255) NULL;
ALTER TABLE contratos_conservacao ADD COLUMN proxima_visita DATE NULL;
ALTER TABLE contratos_conservacao ADD COLUMN ultima_visita DATE NULL;
ALTER TABLE contratos_conservacao ADD COLUMN renovacao_automatica BOOLEAN DEFAULT FALSE;
ALTER TABLE contratos_conservacao ADD COLUMN clausulas_especiais TEXT NULL;

-- 2. Modificar campos existentes
ALTER TABLE contratos_conservacao MODIFY COLUMN numero VARCHAR(50) NOT NULL;
ALTER TABLE contratos_conservacao MODIFY COLUMN cliente_id INT NOT NULL;
ALTER TABLE contratos_conservacao MODIFY COLUMN data_proposta DATE NOT NULL;
ALTER TABLE contratos_conservacao MODIFY COLUMN quantidade_visitas INT NOT NULL DEFAULT 1;
ALTER TABLE contratos_conservacao MODIFY COLUMN data_inicio DATE NOT NULL;
ALTER TABLE contratos_conservacao MODIFY COLUMN data_fim DATE NOT NULL;
ALTER TABLE contratos_conservacao MODIFY COLUMN valor_mensal DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE contratos_conservacao MODIFY COLUMN dia_vencimento INT NOT NULL DEFAULT 10;
ALTER TABLE contratos_conservacao MODIFY COLUMN prazo_meses INT NOT NULL DEFAULT 12;
ALTER TABLE contratos_conservacao MODIFY COLUMN desconto_quant_visitas DECIMAL(5,2) DEFAULT 0.00;

-- 3. Criar índices
CREATE INDEX idx_cliente_id ON contratos_conservacao(cliente_id);
CREATE INDEX idx_proposta_id ON contratos_conservacao(proposta_id);
CREATE INDEX idx_status ON contratos_conservacao(status);
CREATE INDEX idx_data_inicio ON contratos_conservacao(data_inicio);
CREATE INDEX idx_proxima_visita ON contratos_conservacao(proxima_visita);
CREATE UNIQUE INDEX idx_numero_unique ON contratos_conservacao(numero);

-- 4. Criar tabela de visitas
CREATE TABLE contratos_conservacao_visitas (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_contrato_id (contrato_id),
    INDEX idx_data_visita (data_visita),
    INDEX idx_status (status)
);

-- 5. Criar tabela de equipamentos
CREATE TABLE contratos_conservacao_equipamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    observacoes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_contrato_id (contrato_id),
    INDEX idx_equipamento_id (equipamento_id),
    UNIQUE KEY unique_contrato_equipamento (contrato_id, equipamento_id)
);

-- 6. Adicionar foreign keys (execute apenas se as tabelas relacionadas existirem)
-- ALTER TABLE contratos_conservacao ADD CONSTRAINT fk_contratos_conservacao_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE contratos_conservacao ADD CONSTRAINT fk_contratos_conservacao_proposta FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(id) ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE contratos_conservacao_visitas ADD CONSTRAINT fk_visitas_contrato FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE contratos_conservacao_equipamentos ADD CONSTRAINT fk_contrato_equipamentos_contrato FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE contratos_conservacao_equipamentos ADD CONSTRAINT fk_contrato_equipamentos_equipamento FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Verificação
SELECT 'Estrutura atualizada com sucesso' as resultado;
