-- Criar tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamentos_itens (
  id VARCHAR(36) PRIMARY KEY,
  orcamento_numero VARCHAR(20) NOT NULL,
  produto_id VARCHAR(36) NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao_personalizada TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_orcamento_numero (orcamento_numero),
  INDEX idx_produto_id (produto_id),
  
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Trigger para atualizar updated_at
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_orcamentos_itens_updated_at
  BEFORE UPDATE ON orcamentos_itens
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;
