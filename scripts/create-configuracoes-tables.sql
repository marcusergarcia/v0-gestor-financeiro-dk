-- Tabela para configurações de layout de impressão
CREATE TABLE IF NOT EXISTS configuracoes_layout (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tamanho_papel VARCHAR(20) DEFAULT 'A4',
  orientacao VARCHAR(20) DEFAULT 'retrato',
  margem_superior DECIMAL(5,2) DEFAULT 10.00,
  margem_inferior DECIMAL(5,2) DEFAULT 10.00,
  margem_esquerda DECIMAL(5,2) DEFAULT 15.00,
  margem_direita DECIMAL(5,2) DEFAULT 15.00,
  cabecalho TEXT,
  rodape TEXT,
  empresa_nome VARCHAR(255),
  empresa_cnpj VARCHAR(20),
  empresa_endereco TEXT,
  empresa_telefone VARCHAR(20),
  empresa_email VARCHAR(100),
  empresa_site VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para feriados
CREATE TABLE IF NOT EXISTS feriados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo ENUM('nacional', 'estadual', 'municipal', 'comercial') DEFAULT 'nacional',
  recorrente BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_data_ativo (data, ativo)
);

-- Tabela para equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  valor_hora DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para configurações de visitas técnicas
CREATE TABLE IF NOT EXISTS visitas_tecnicas_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantidade_visitas INT NOT NULL,
  percentual_desconto DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para logos do sistema
CREATE TABLE IF NOT EXISTS logos_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('sistema', 'menu', 'impressao', 'favicon') NOT NULL,
  nome VARCHAR(255) NOT NULL,
  dados LONGTEXT, -- Base64 da imagem
  formato VARCHAR(10), -- jpg, png, svg, etc
  tamanho INT, -- tamanho em bytes
  dimensoes VARCHAR(20), -- ex: 200x100
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tipo_ativo (tipo, ativo)
);

-- Tabela para configuração de valor por km
CREATE TABLE IF NOT EXISTS valor_km_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  valor_por_km DECIMAL(10,2) NOT NULL DEFAULT 1.50,
  descricao TEXT,
  aplicacao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para termos e contratos
CREATE TABLE IF NOT EXISTS termos_contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('termo_uso', 'termo_privacidade', 'contrato_conservacao', 'contrato_servico') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  conteudo LONGTEXT NOT NULL,
  versao VARCHAR(10) DEFAULT '1.0',
  obrigatorio BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir dados padrão
INSERT IGNORE INTO feriados (data, nome, tipo, recorrente) VALUES
('2024-01-01', 'Confraternização Universal', 'nacional', true),
('2024-04-21', 'Tiradentes', 'nacional', true),
('2024-05-01', 'Dia do Trabalhador', 'nacional', true),
('2024-09-07', 'Independência do Brasil', 'nacional', true),
('2024-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
('2024-11-02', 'Finados', 'nacional', true),
('2024-11-15', 'Proclamação da República', 'nacional', true),
('2024-12-25', 'Natal', 'nacional', true);

INSERT IGNORE INTO equipamentos (nome, valor_hora) VALUES
('Furadeira', 15.00),
('Parafusadeira', 12.00),
('Alicate', 8.00),
('Multímetro', 25.00),
('Escada', 10.00);

INSERT IGNORE INTO valor_km_config (valor_por_km, descricao, aplicacao) VALUES
(1.50, 'Valor padrão por quilômetro rodado', 'Usado em orçamentos e contratos de visitas técnicas');
