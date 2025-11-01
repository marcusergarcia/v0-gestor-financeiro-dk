-- Criar tabela de configurações de visitas técnicas
CREATE TABLE IF NOT EXISTS visitas_tecnicas_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantidade_visitas INT NOT NULL,
  percentual_desconto DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_ativo (ativo),
  INDEX idx_quantidade (quantidade_visitas),
  
  -- Constraint para evitar duplicatas
  UNIQUE KEY unique_quantidade_ativo (quantidade_visitas, ativo)
);

-- Inserir algumas configurações padrão
INSERT IGNORE INTO visitas_tecnicas_config (quantidade_visitas, percentual_desconto, ativo) VALUES
(1, 0.00, 1),
(2, 5.00, 1),
(3, 10.00, 1),
(4, 15.00, 1);
