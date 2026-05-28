-- Criar tabela de ordens de serviço
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
