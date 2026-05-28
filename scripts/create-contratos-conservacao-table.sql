-- Criar tabela de contratos de conservação
CREATE TABLE IF NOT EXISTS contratos_conservacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status ENUM('ativo', 'inativo', 'cancelado') DEFAULT 'ativo',
  valor_mensal DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_numero (numero),
  INDEX idx_status (status)
);

-- Inserir alguns contratos de exemplo se a tabela estiver vazia
INSERT IGNORE INTO contratos_conservacao (numero, cliente_id, data_inicio, status, valor_mensal, observacoes) VALUES
('CONT-2024-001', 1, '2024-01-01', 'ativo', 2500.00, 'Contrato de conservação mensal'),
('CONT-2024-002', 2, '2024-02-01', 'ativo', 3000.00, 'Contrato de conservação com equipamentos especiais'),
('CONT-2024-003', 3, '2024-03-01', 'ativo', 1800.00, 'Contrato básico de conservação');

-- Criar tabela de equipamentos do contrato
CREATE TABLE IF NOT EXISTS contratos_conservacao_equipamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contrato_id INT NOT NULL,
  equipamento_id INT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (contrato_id) REFERENCES contratos_conservacao(id) ON DELETE CASCADE,
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_contrato_equipamento (contrato_id, equipamento_id)
);
