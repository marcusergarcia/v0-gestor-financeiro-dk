-- Criar tabela contratos_conservacao se não existir
CREATE TABLE IF NOT EXISTS contratos_conservacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NULL,
  status ENUM('ativo', 'inativo', 'suspenso', 'cancelado') DEFAULT 'ativo',
  valor_mensal DECIMAL(10,2) NULL,
  frequencia ENUM('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') DEFAULT 'mensal',
  quantidade_visitas INT DEFAULT 1,
  prazo_meses INT NULL,
  equipamentos_inclusos TEXT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_status (status),
  INDEX idx_numero (numero)
);

-- Inserir dados de exemplo se a tabela estiver vazia
INSERT IGNORE INTO contratos_conservacao (
  numero, 
  cliente_id, 
  data_inicio, 
  data_fim, 
  status, 
  valor_mensal, 
  frequencia, 
  quantidade_visitas, 
  prazo_meses, 
  equipamentos_inclusos, 
  observacoes
) VALUES 
(
  '20250725-001', 
  1, 
  '2025-01-01', 
  '2025-12-31', 
  'ativo', 
  2500.00, 
  'mensal', 
  2, 
  12, 
  'Elevador Social\nElevador de Serviço\nPortão Automático\nSistema de Interfone',
  'Contrato de conservação mensal com 2 visitas por mês'
),
(
  '20250725-002', 
  45, 
  '2025-01-15', 
  '2025-12-15', 
  'ativo', 
  1800.00, 
  'mensal', 
  1, 
  12, 
  'Elevador Principal\nSistema de Segurança\nPortão Eletrônico',
  'Contrato de conservação com visita mensal'
),
(
  '20250725-003', 
  2, 
  '2024-06-01', 
  '2025-05-31', 
  'ativo', 
  3200.00, 
  'bimestral', 
  1, 
  12, 
  'Elevador Social\nElevador Panorâmico\nSistema de Ar Condicionado Central\nGerador de Emergência',
  'Contrato bimestral para edifício comercial'
);
