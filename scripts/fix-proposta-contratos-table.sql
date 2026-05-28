-- Garantir que a tabela proposta_contratos existe com a estrutura correta
CREATE TABLE IF NOT EXISTS proposta_contratos (
  id VARCHAR(36) PRIMARY KEY,
  numero INT AUTO_INCREMENT UNIQUE,
  cliente_id INT NOT NULL,
  tipo ENUM('conservacao', 'instalacao', 'manutencao') DEFAULT 'conservacao',
  frequencia ENUM('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') DEFAULT 'mensal',
  valor_equipamentos DECIMAL(10,2) DEFAULT 0.00,
  valor_desconto DECIMAL(10,2) DEFAULT 0.00,
  valor_deslocamento DECIMAL(10,2) DEFAULT 0.00,
  desconto_quant_visitas DECIMAL(10,2) DEFAULT 0.00,
  valor_total_proposta DECIMAL(10,2) DEFAULT 0.00,
  forma_pagamento ENUM('mensal', 'trimestral', 'semestral', 'anual', 'avista') DEFAULT 'mensal',
  prazo_contrato INT DEFAULT 12,
  garantia INT DEFAULT 90,
  observacoes TEXT,
  status ENUM('rascunho', 'enviada', 'aprovada', 'rejeitada') DEFAULT 'rascunho',
  data_proposta DATE,
  data_validade DATE,
  quantidade_visitas INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Garantir que a tabela proposta_itens existe com a estrutura correta
CREATE TABLE IF NOT EXISTS proposta_itens (
  id VARCHAR(36) PRIMARY KEY,
  proposta_id INT NOT NULL,
  equipamento_id INT,
  categoria VARCHAR(100),
  quantidade INT DEFAULT 1,
  valor_unitario DECIMAL(10,2) DEFAULT 0.00,
  valor_desconto_individual DECIMAL(10,2) DEFAULT 0.00,
  valor_desconto_categoria DECIMAL(10,2) DEFAULT 0.00,
  valor_total DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposta_id) REFERENCES proposta_contratos(numero) ON DELETE CASCADE,
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE SET NULL
);

-- Verificar se o AUTO_INCREMENT está configurado corretamente
ALTER TABLE proposta_contratos AUTO_INCREMENT = 1;
