-- Verificar estrutura da tabela ordens_servico
DESCRIBE ordens_servico;

-- Se a tabela não existir, criar com estrutura básica
CREATE TABLE IF NOT EXISTS ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  contrato_id VARCHAR(50),
  tecnico_id INT,
  tecnico_name VARCHAR(255),
  tecnico_email VARCHAR(255),
  solicitado_por VARCHAR(255),
  data_atual DATE,
  horario_entrada TIME,
  horario_saida TIME,
  tipo_servico VARCHAR(100),
  relatorio_visita TEXT,
  servico_realizado TEXT,
  observacoes TEXT,
  responsavel VARCHAR(100),
  nome_responsavel VARCHAR(255),
  situacao VARCHAR(50) DEFAULT 'pendente',
  equipamentos JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_numero (numero),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_data_atual (data_atual),
  INDEX idx_situacao (situacao)
);

-- Verificar novamente
DESCRIBE ordens_servico;
