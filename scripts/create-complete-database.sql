-- Criar banco de dados completo baseado na estrutura existente

-- Tabela de feriados
CREATE TABLE IF NOT EXISTS feriados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  tipo ENUM('nacional', 'estadual', 'municipal', 'pessoa') DEFAULT 'nacional',
  recorrente TINYINT(1) DEFAULT 0,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_feriados_data (data),
  INDEX idx_feriados_tipo (tipo)
);

-- Tabela de marcas
CREATE TABLE IF NOT EXISTS marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  sigla VARCHAR(10),
  contador INT(1) DEFAULT 0,
  descricao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marcas_nome (nome),
  INDEX idx_marcas_sigla (sigla)
);

-- Tabela de configurações valor por km
CREATE TABLE IF NOT EXISTS configuracoes_valor_km (
  id INT AUTO_INCREMENT PRIMARY KEY,
  valor_por_km DECIMAL(10,2) NOT NULL DEFAULT 1.50,
  descricao TEXT,
  aplicacao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  valor_hora DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_equipamentos_nome (nome)
);

-- Tabela de tipos de produtos
CREATE TABLE IF NOT EXISTS tipos_produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(50),
  descricao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_codigo (codigo),
  INDEX idx_tipos_produtos_codigo (codigo),
  INDEX idx_tipos_produtos_nome (nome),
  INDEX idx_tipos_produtos_categoria (categoria)
);

-- Tabela de logos do sistema
CREATE TABLE IF NOT EXISTS logos_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('sistema', 'menu', 'impressao', 'favicon') NOT NULL,
  nome VARCHAR(250) NOT NULL,
  dados LONGTEXT,
  formato VARCHAR(10) DEFAULT 'png',
  tamanho INT(1) DEFAULT 0,
  dimensoes VARCHAR(20),
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tipo_ativo (tipo, ativo)
);

-- Tabela de configuração de timbrado
CREATE TABLE IF NOT EXISTS timbrado_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_nome VARCHAR(200),
  empresa_cnpj VARCHAR(20),
  empresa_endereco TEXT,
  empresa_telefone VARCHAR(30),
  empresa_email VARCHAR(100),
  empresa_site VARCHAR(100),
  rodape_texto TEXT,
  configuracoes LONGTEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tamanho_papel VARCHAR(20) DEFAULT 'A4',
  orientacao VARCHAR(20) DEFAULT 'retrato',
  margem_superior INT(1) DEFAULT 10,
  margem_inferior INT(1) DEFAULT 10,
  margem_esquerda INT(1) DEFAULT 15,
  margem_direita INT(1) DEFAULT 15,
  cabecalho TEXT,
  rodape TEXT
);

-- Tabela de configuração de visitas técnicas
CREATE TABLE IF NOT EXISTS visitas_tecnicas_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantidade_visitas INT(1) NOT NULL,
  percentual_desconto DECIMAL(5,2) DEFAULT 0.00,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Atualizar tabela de produtos com estrutura completa
DROP TABLE IF EXISTS produtos_temp;
CREATE TABLE produtos_temp AS SELECT * FROM produtos;

DROP TABLE produtos;
CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  ncm VARCHAR(20),
  unidade VARCHAR(10) DEFAULT 'UN',
  valor_unitario DECIMAL(10,2) DEFAULT 0.00,
  valor_mao_obra DECIMAL(10,2) DEFAULT 0.00,
  valor_custo DECIMAL(10,2) DEFAULT 0.00,
  margem_lucro DECIMAL(5,2) DEFAULT 0.00,
  estoque DECIMAL(10,2) DEFAULT 0.00,
  estoque_minimo DECIMAL(10,2) DEFAULT 0.00,
  tipo VARCHAR(50),
  marca VARCHAR(100),
  observacoes TEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  categoria_id VARCHAR(50),
  marca_id VARCHAR(50),
  UNIQUE KEY unique_codigo (codigo),
  INDEX idx_produtos_codigo (codigo),
  INDEX idx_produtos_descricao (descricao),
  INDEX idx_produtos_tipo (tipo),
  INDEX idx_produtos_marca (marca),
  INDEX idx_produtos_categoria_id (categoria_id),
  INDEX idx_produtos_marca_id (marca_id)
);

-- Migrar dados existentes
INSERT INTO produtos (codigo, descricao, valor_unitario, ativo, created_at)
SELECT 
  COALESCE(codigo, CONCAT('PROD-', id)) as codigo,
  COALESCE(nome, descricao, 'Produto sem nome') as descricao,
  COALESCE(preco, valor_unitario, 0) as valor_unitario,
  COALESCE(ativo, 1) as ativo,
  COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
FROM produtos_temp;

DROP TABLE produtos_temp;

-- Atualizar tabela de boletos com estrutura completa
ALTER TABLE boletos 
ADD COLUMN IF NOT EXISTS contrato_id INT,
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
ADD COLUMN IF NOT EXISTS data_emissao DATE,
ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50) DEFAULT 'boleto',
ADD COLUMN IF NOT EXISTS valor_juros DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_multa DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_desconto DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS nosso_numero VARCHAR(50),
ADD COLUMN IF NOT EXISTS linha_digitavel VARCHAR(100),
ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(100);

-- Inserir dados iniciais

-- Feriados nacionais básicos
INSERT IGNORE INTO feriados (data, nome, tipo, recorrente) VALUES
('2024-01-01', 'Confraternização Universal', 'nacional', 1),
('2024-04-21', 'Tiradentes', 'nacional', 1),
('2024-05-01', 'Dia do Trabalhador', 'nacional', 1),
('2024-09-07', 'Independência do Brasil', 'nacional', 1),
('2024-10-12', 'Nossa Senhora Aparecida', 'nacional', 1),
('2024-11-02', 'Finados', 'nacional', 1),
('2024-11-15', 'Proclamação da República', 'nacional', 1),
('2024-12-25', 'Natal', 'nacional', 1);

-- Marcas básicas
INSERT IGNORE INTO marcas (nome, sigla, descricao) VALUES
('Genérica', 'GEN', 'Marca genérica para produtos sem marca específica'),
('Nacional', 'NAC', 'Produtos de fabricação nacional'),
('Importada', 'IMP', 'Produtos importados');

-- Configuração valor por km
INSERT IGNORE INTO configuracoes_valor_km (valor_por_km, descricao, aplicacao) VALUES
(1.50, 'Valor padrão por quilômetro rodado', 'Aplicado em visitas técnicas e deslocamentos');

-- Equipamentos básicos
INSERT IGNORE INTO equipamentos (nome, valor_hora) VALUES
('Furadeira', 25.00),
('Parafusadeira', 20.00),
('Martelo', 15.00),
('Chaves diversas', 10.00);

-- Tipos de produtos básicos
INSERT IGNORE INTO tipos_produtos (codigo, nome, categoria, descricao) VALUES
('PARAF', 'Parafusos', 'Fixação', 'Parafusos diversos para fixação'),
('PORCA', 'Porcas', 'Fixação', 'Porcas para parafusos'),
('ARRUE', 'Arruelas', 'Fixação', 'Arruelas diversas'),
('BUCHAS', 'Buchas', 'Fixação', 'Buchas para fixação em paredes');

-- Configuração de timbrado básica
INSERT IGNORE INTO timbrado_config (
  empresa_nome, 
  empresa_cnpj, 
  empresa_endereco, 
  empresa_telefone, 
  empresa_email,
  tamanho_papel,
  orientacao
) VALUES (
  'Sua Empresa Ltda',
  '00.000.000/0001-00',
  'Rua Exemplo, 123 - Centro - Cidade/UF - CEP: 00000-000',
  '(11) 99999-9999',
  'contato@suaempresa.com.br',
  'A4',
  'retrato'
);

-- Configuração de visitas técnicas
INSERT IGNORE INTO visitas_tecnicas_config (quantidade_visitas, percentual_desconto) VALUES
(1, 0.00),
(2, 5.00),
(3, 10.00),
(5, 15.00);
