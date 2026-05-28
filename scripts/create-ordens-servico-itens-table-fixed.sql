-- Verificar se as tabelas necessárias existem antes de criar as foreign keys
SET @tables_exist = (
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = DATABASE() 
  AND table_name IN ('ordens_servico', 'equipamentos')
);

-- Criar tabela de itens das ordens de serviço (equipamentos)
CREATE TABLE IF NOT EXISTS ordens_servico_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_servico_id INT NOT NULL,
  equipamento_id INT NOT NULL,
  equipamento_nome VARCHAR(255) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  observacoes TEXT,
  situacao ENUM('ok', 'defeito', 'manutencao', 'substituido') DEFAULT 'ok',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices básicos
  INDEX idx_ordem_servico_id (ordem_servico_id),
  INDEX idx_equipamento_id (equipamento_id),
  INDEX idx_situacao (situacao)
);

-- Adicionar foreign keys apenas se as tabelas existirem
-- Foreign key para ordens_servico
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'ordens_servico') > 0,
  'ALTER TABLE ordens_servico_itens ADD CONSTRAINT fk_ordens_servico_itens_ordem_servico FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "Tabela ordens_servico não encontrada" as warning'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Foreign key para equipamentos
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'equipamentos') > 0,
  'ALTER TABLE ordens_servico_itens ADD CONSTRAINT fk_ordens_servico_itens_equipamento FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT "Tabela equipamentos não encontrada" as warning'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar constraint única para evitar duplicação
ALTER TABLE ordens_servico_itens 
ADD CONSTRAINT uk_ordem_equipamento UNIQUE (ordem_servico_id, equipamento_id);

-- Adicionar comentário
ALTER TABLE ordens_servico_itens COMMENT = 'Tabela de equipamentos relacionados às ordens de serviço';
