-- Verificar se a tabela existe e sua estrutura atual
DESCRIBE ordens_servico_itens;

-- Dropar a tabela se existir para recriar com estrutura correta
DROP TABLE IF EXISTS ordens_servico_itens;

-- Criar tabela ordens_servico_itens com estrutura correta
CREATE TABLE ordens_servico_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ordem_servico_id INT NOT NULL,
  equipamento_id INT NOT NULL,
  equipamento_nome VARCHAR(255) NOT NULL,
  quantidade INT DEFAULT 1,
  observacoes TEXT,
  situacao ENUM('ok', 'defeito', 'manutencao', 'substituido') DEFAULT 'ok',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para performance
  INDEX idx_ordem_servico_id (ordem_servico_id),
  INDEX idx_equipamento_id (equipamento_id),
  
  -- Constraint única para evitar duplicatas
  UNIQUE KEY uk_ordem_equipamento (ordem_servico_id, equipamento_id),
  
  -- Foreign key para ordens_servico (se a tabela existir)
  FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  
  -- Foreign key para equipamentos (se a tabela existir)
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE RESTRICT
);

-- Verificar a estrutura final
DESCRIBE ordens_servico_itens;
