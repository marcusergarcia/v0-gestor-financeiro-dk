CREATE TABLE IF NOT EXISTS contrato_itens (
  id VARCHAR(36) PRIMARY KEY,
  contrato_numero VARCHAR(50) NOT NULL,
  equipamento_id INT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contrato_numero (contrato_numero),
  INDEX idx_equipamento_id (equipamento_id),
  FOREIGN KEY (contrato_numero) REFERENCES contratos(numero) ON DELETE CASCADE
);
