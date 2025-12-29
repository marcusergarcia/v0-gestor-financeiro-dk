-- Criar tabela para armazenar logs de integração PagBank
CREATE TABLE IF NOT EXISTS pagbank_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  method VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_data TEXT,
  response_data TEXT,
  status INT NOT NULL,
  payment_type VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT true,
  INDEX idx_timestamp (timestamp),
  INDEX idx_payment_type (payment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
