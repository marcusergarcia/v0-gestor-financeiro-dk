-- Adicionar campos necessários para integração PagSeguro
ALTER TABLE boletos
ADD COLUMN pagseguro_id VARCHAR(100) COMMENT 'ID do boleto no PagSeguro',
ADD COLUMN linha_digitavel TEXT COMMENT 'Linha digitável do boleto',
ADD COLUMN codigo_barras TEXT COMMENT 'Código de barras do boleto',
ADD COLUMN link_pdf TEXT COMMENT 'Link para PDF do boleto',
ADD COLUMN link_impressao TEXT COMMENT 'Link alternativo para impressão',
ADD COLUMN qr_code TEXT COMMENT 'QR Code do boleto (se disponível)',
ADD COLUMN multa DECIMAL(5,2) DEFAULT 2.00 COMMENT 'Percentual de multa',
ADD COLUMN juros DECIMAL(5,2) DEFAULT 0.033 COMMENT 'Percentual de juros ao dia',
ADD COLUMN desconto DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentual de desconto',
ADD COLUMN webhook_notificado BOOLEAN DEFAULT FALSE COMMENT 'Se foi notificado via webhook';

-- Criar tabela para controle de cashback ClubePag
CREATE TABLE IF NOT EXISTS cashback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  valor_compra DECIMAL(10,2) NOT NULL,
  percentual_cashback DECIMAL(5,2) NOT NULL,
  valor_cashback DECIMAL(10,2) NOT NULL,
  status ENUM('pendente', 'disponivel', 'resgatado') DEFAULT 'pendente',
  boleto_id INT,
  data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_disponibilizacao TIMESTAMP NULL,
  data_resgate TIMESTAMP NULL,
  pagseguro_cashback_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (boleto_id) REFERENCES boletos(id)
);

-- Criar tabela para pagamentos via Payout
CREATE TABLE IF NOT EXISTS pagamentos_payout (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('fornecedor', 'conta', 'servico') NOT NULL,
  beneficiario_nome VARCHAR(255) NOT NULL,
  beneficiario_documento VARCHAR(20) NOT NULL,
  beneficiario_telefone VARCHAR(20),
  beneficiario_email VARCHAR(255),
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  metodo_pagamento ENUM('pix', 'transferencia', 'conta_pagbank') NOT NULL,
  chave_pix VARCHAR(255) COMMENT 'Chave PIX se método for PIX',
  banco VARCHAR(10) COMMENT 'Código do banco se transferência',
  agencia VARCHAR(10) COMMENT 'Agência se transferência',
  conta VARCHAR(20) COMMENT 'Conta se transferência',
  tipo_conta ENUM('corrente', 'poupanca') COMMENT 'Tipo de conta se transferência',
  status ENUM('pendente', 'processando', 'concluido', 'cancelado', 'falhou') DEFAULT 'pendente',
  pagseguro_id VARCHAR(100) COMMENT 'ID da transação no PagSeguro',
  pagseguro_status VARCHAR(50),
  erro_mensagem TEXT COMMENT 'Mensagem de erro se houver',
  agendado_para DATE COMMENT 'Data agendada para pagamento',
  processado_em TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela para configurações do PagSeguro
CREATE TABLE IF NOT EXISTS configuracoes_pagseguro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chave VARCHAR(50) NOT NULL UNIQUE,
  valor TEXT,
  descricao TEXT,
  tipo ENUM('text', 'number', 'boolean', 'json') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO configuracoes_pagseguro (chave, valor, descricao, tipo) VALUES
('cashback_percentual_padrao', '2.00', 'Percentual padrão de cashback para clientes', 'number'),
('cashback_ativo', 'true', 'Se o sistema de cashback está ativo', 'boolean'),
('multa_padrao', '2.00', 'Percentual padrão de multa para boletos', 'number'),
('juros_padrao', '0.033', 'Percentual padrão de juros ao dia para boletos', 'number')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
