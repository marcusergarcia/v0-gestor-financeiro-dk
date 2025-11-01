-- Remover tabela se existir para recriar
DROP TABLE IF EXISTS ordens_servico_itens;

-- Criar tabela de itens das ordens de serviço sem foreign keys primeiro
CREATE TABLE ordens_servico_itens (
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
  INDEX idx_situacao (situacao),
  
  -- Constraint única para evitar duplicação
  UNIQUE KEY uk_ordem_equipamento (ordem_servico_id, equipamento_id)
);

-- Adicionar foreign keys separadamente
ALTER TABLE ordens_servico_itens 
ADD CONSTRAINT fk_ordens_servico_itens_ordem_servico 
FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE ordens_servico_itens 
ADD CONSTRAINT fk_ordens_servico_itens_equipamento 
FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adicionar comentário
ALTER TABLE ordens_servico_itens 
COMMENT = 'Tabela de equipamentos relacionados às ordens de serviço';
