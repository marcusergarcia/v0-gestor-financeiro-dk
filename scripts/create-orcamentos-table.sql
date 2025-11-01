-- Criar tabela principal de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id VARCHAR(36) PRIMARY KEY,
  numero VARCHAR(20) UNIQUE NOT NULL,
  cliente_id VARCHAR(36) NOT NULL,
  tipo_servico VARCHAR(100) NOT NULL,
  detalhes_servico TEXT,
  valor_material DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  data_orcamento DATE NOT NULL,
  validade INT NOT NULL DEFAULT 30,
  situacao ENUM('pendente', 'aprovado', 'rejeitado', 'cancelado') NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  
  INDEX idx_numero (numero),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_data_orcamento (data_orcamento),
  INDEX idx_situacao (situacao)
);

-- Criar tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamentos_itens (
  id VARCHAR(36) PRIMARY KEY,
  orcamento_id VARCHAR(36) NOT NULL,
  produto_id VARCHAR(36) NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao_personalizada TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
  
  INDEX idx_orcamento_id (orcamento_id),
  INDEX idx_produto_id (produto_id)
);
