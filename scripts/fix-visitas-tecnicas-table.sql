-- Remover constraint única problemática e recriar tabela corretamente
DROP TABLE IF EXISTS visitas_tecnicas_config;

CREATE TABLE visitas_tecnicas_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantidade_visitas INT NOT NULL,
  percentual_desconto DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para performance
  INDEX idx_ativo (ativo),
  INDEX idx_quantidade (quantidade_visitas),
  
  -- Constraint única apenas para quantidade (não incluindo ativo)
  UNIQUE KEY unique_quantidade (quantidade_visitas)
);

-- Inserir configurações padrão
INSERT INTO visitas_tecnicas_config (quantidade_visitas, percentual_desconto, ativo) VALUES
(1, 0.00, 1),
(2, 5.00, 1),
(3, 10.00, 1),
(4, 15.00, 1),
(5, 20.00, 1);
