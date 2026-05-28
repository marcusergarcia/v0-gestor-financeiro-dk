-- Verificar se a tabela ordens_servico existe, se não, criar
CREATE TABLE IF NOT EXISTS ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  contrato_id VARCHAR(50),
  tecnico_id INT NOT NULL,
  tecnico_name VARCHAR(100) NOT NULL,
  tecnico_email VARCHAR(100),
  solicitado_por VARCHAR(100),
  data_atual DATE NOT NULL,
  horario_entrada TIME,
  horario_saida TIME,
  tipo_servico ENUM('manutencao', 'orcamento', 'vistoria_contrato', 'preventiva') NOT NULL,
  relatorio_visita TEXT,
  servico_realizado TEXT,
  observacoes TEXT,
  responsavel ENUM('zelador', 'porteiro', 'sindico', 'outros') NOT NULL,
  nome_responsavel VARCHAR(30) NOT NULL,
  situacao ENUM('rascunho', 'aberta', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'rascunho',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_numero (numero),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_data_atual (data_atual),
  INDEX idx_situacao (situacao),
  INDEX idx_tipo_servico (tipo_servico)
);

-- Verificar se a tabela equipamentos existe, se não, criar uma básica
CREATE TABLE IF NOT EXISTS equipamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT,
  valor_hora DECIMAL(10,2) DEFAULT 0.00,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_nome (nome),
  INDEX idx_categoria (categoria),
  INDEX idx_ativo (ativo)
);

-- Inserir alguns equipamentos básicos se a tabela estiver vazia
INSERT IGNORE INTO equipamentos (nome, categoria, descricao) VALUES
('Ar Condicionado', 'Climatização', 'Equipamento de ar condicionado'),
('Elevador', 'Transporte', 'Elevador do prédio'),
('Bomba d\'água', 'Hidráulica', 'Bomba do sistema hidráulico'),
('Portão Eletrônico', 'Segurança', 'Portão de acesso automático'),
('Interfone', 'Comunicação', 'Sistema de interfone'),
('Iluminação', 'Elétrica', 'Sistema de iluminação'),
('CFTV', 'Segurança', 'Sistema de câmeras'),
('Gerador', 'Energia', 'Gerador de energia');
