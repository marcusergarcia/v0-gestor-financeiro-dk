-- Criar tabela proposta_itens
CREATE TABLE IF NOT EXISTS proposta_itens (
  id VARCHAR(36) PRIMARY KEY,
  proposta_id VARCHAR(50) NOT NULL,
  equipamento_id INT(11) NOT NULL,
  categoria ENUM('basicos', 'portoes_veiculos', 'portoes_pedestre', 'software_redes') NOT NULL,
  quantidade INT(11) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_desconto_individual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_desconto_categoria DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_proposta_itens_proposta (proposta_id),
  INDEX idx_proposta_itens_equipamento (equipamento_id),
  INDEX idx_proposta_itens_categoria (categoria),
  FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(numero) ON DELETE CASCADE
);

-- Inserir equipamentos de exemplo com categorias
INSERT IGNORE INTO equipamentos (nome, categoria, valor_hora) VALUES
-- Básicos
('Sistema de Interfones', 'basicos', 150.00),
('Sistema de Antenas Coletivas', 'basicos', 200.00),
('Sistema de Luz de Emergência', 'basicos', 120.00),
('Sistema de Câmeras', 'basicos', 300.00),
('Sistema de Alarmes', 'basicos', 250.00),

-- Portões de Veículos
('Automatizadores de Portões de Veículos', 'portoes_veiculos', 400.00),
('Controle de Acesso Controle TX', 'portoes_veiculos', 180.00),
('Controle de Acesso Tag Veícular', 'portoes_veiculos', 220.00),

-- Portões de Pedestre
('Automatizadores de Pedestres', 'portoes_pedestre', 350.00),
('Sistema de Eletroímã', 'portoes_pedestre', 280.00),
('Controle de Acesso Facial', 'portoes_pedestre', 500.00),
('Controle de Acesso Cartão', 'portoes_pedestre', 320.00),

-- Software e Redes
('Licença de Software (FcAccess, IMódulo, Condfy)', 'software_redes', 800.00),
('Sistema de CPU e Redes', 'software_redes', 600.00);

-- Adicionar coluna categoria na tabela equipamentos se não existir
ALTER TABLE equipamentos 
ADD COLUMN IF NOT EXISTS categoria ENUM('basicos', 'portoes_veiculos', 'portoes_pedestre', 'software_redes') DEFAULT 'basicos';
