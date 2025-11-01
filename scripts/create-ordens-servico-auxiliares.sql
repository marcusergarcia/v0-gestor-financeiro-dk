-- Criar tabela para fotos das ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico_fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_servico_id INT NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(500) NOT NULL,
  tipo_foto ENUM('antes', 'durante', 'depois') NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ordem_servico_id (ordem_servico_id)
);

-- Criar tabela para assinaturas das ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico_assinaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_servico_id INT NOT NULL,
  tipo_assinatura ENUM('tecnico', 'responsavel') NOT NULL,
  assinatura_base64 LONGTEXT NOT NULL,
  nome_assinante VARCHAR(100) NOT NULL,
  data_assinatura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ordem_servico_id (ordem_servico_id)
);

-- Adicionar foreign keys para as tabelas auxiliares
ALTER TABLE ordens_servico_fotos 
ADD CONSTRAINT fk_ordens_servico_fotos_ordem_servico 
FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE ordens_servico_assinaturas 
ADD CONSTRAINT fk_ordens_servico_assinaturas_ordem_servico 
FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) 
ON DELETE CASCADE ON UPDATE CASCADE;
