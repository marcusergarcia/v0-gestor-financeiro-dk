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
  
  -- Chave estrangeira para ordens_servico
  CONSTRAINT fk_ordens_servico_itens_ordem_servico 
    FOREIGN KEY (ordem_servico_id) 
    REFERENCES ordens_servico(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Chave estrangeira para equipamentos
  CONSTRAINT fk_ordens_servico_itens_equipamento 
    FOREIGN KEY (equipamento_id) 
    REFERENCES equipamentos(id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  
  -- Índices para otimização
  INDEX idx_ordem_servico_id (ordem_servico_id),
  INDEX idx_equipamento_id (equipamento_id),
  INDEX idx_situacao (situacao),
  
  -- Constraint única para evitar duplicação do mesmo equipamento na mesma ordem
  UNIQUE KEY uk_ordem_equipamento (ordem_servico_id, equipamento_id)
);

-- Remover a coluna equipamentos da tabela ordens_servico (não será mais necessária)
ALTER TABLE ordens_servico DROP COLUMN IF EXISTS equipamentos;

-- Adicionar comentários para documentação
ALTER TABLE ordens_servico_itens COMMENT = 'Tabela de equipamentos relacionados às ordens de serviço';
