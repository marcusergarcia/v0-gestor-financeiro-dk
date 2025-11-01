CREATE TABLE IF NOT EXISTS ordens_servico_assinaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_servico_id INT NOT NULL,
  tipo_assinatura ENUM('tecnico', 'responsavel') NOT NULL,
  assinatura_base64 LONGTEXT NOT NULL,
  nome_assinante VARCHAR(255) NOT NULL,
  data_assinatura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tipo_por_ordem (ordem_servico_id, tipo_assinatura),
  INDEX idx_ordem_servico_id (ordem_servico_id),
  INDEX idx_tipo_assinatura (tipo_assinatura)
);
