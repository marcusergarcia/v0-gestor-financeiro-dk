CREATE TABLE IF NOT EXISTS ordens_servico_fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_servico_id INT NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(500) NOT NULL,
  tipo_foto ENUM('antes', 'durante', 'depois') NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  INDEX idx_ordem_servico_id (ordem_servico_id),
  INDEX idx_tipo_foto (tipo_foto)
);
