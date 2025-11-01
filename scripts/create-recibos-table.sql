-- Criar tabela de recibos se não existir
CREATE TABLE IF NOT EXISTS recibos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_emissao DATE NOT NULL,
  descricao TEXT NOT NULL,
  observacoes TEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_numero (numero),
  INDEX idx_data_emissao (data_emissao),
  INDEX idx_ativo (ativo)
);
