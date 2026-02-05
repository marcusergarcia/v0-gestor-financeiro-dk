-- Tabela de Notas Fiscais de Servico (NFS-e)
-- Integrada com o Asaas para emissao automatica

CREATE TABLE IF NOT EXISTS notas_fiscais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Dados basicos da NFS-e
  numero VARCHAR(50),
  cliente_id INT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao_servico TEXT NOT NULL,
  observacoes TEXT,
  
  -- Datas
  data_emissao DATE,
  data_competencia DATE,
  
  -- Servico municipal
  municipal_service_id VARCHAR(50),
  municipal_service_code VARCHAR(20),
  municipal_service_name VARCHAR(500),
  
  -- Impostos
  iss_percentual DECIMAL(5,2) DEFAULT 0.00,
  cofins_percentual DECIMAL(5,2) DEFAULT 0.00,
  csll_percentual DECIMAL(5,2) DEFAULT 0.00,
  inss_percentual DECIMAL(5,2) DEFAULT 0.00,
  ir_percentual DECIMAL(5,2) DEFAULT 0.00,
  pis_percentual DECIMAL(5,2) DEFAULT 0.00,
  reter_iss TINYINT(1) DEFAULT 0,
  deducoes DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status da NFS-e
  status ENUM(
    'rascunho',
    'agendada', 
    'sincronizada',
    'autorizada',
    'processando_cancelamento',
    'cancelada',
    'cancelamento_negado',
    'erro'
  ) DEFAULT 'rascunho',
  
  -- Integracao Asaas
  asaas_id VARCHAR(100),
  asaas_payment_id VARCHAR(100),
  asaas_customer_id VARCHAR(100),
  asaas_status VARCHAR(50),
  asaas_numero VARCHAR(50),
  asaas_pdf_url TEXT,
  asaas_xml_url TEXT,
  asaas_rps_number VARCHAR(50),
  asaas_error_message TEXT,
  
  -- Vinculo com boleto/orcamento
  boleto_id INT,
  orcamento_numero VARCHAR(50),
  
  -- Metadados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indices
  INDEX idx_nf_cliente (cliente_id),
  INDEX idx_nf_status (status),
  INDEX idx_nf_asaas_id (asaas_id),
  INDEX idx_nf_data_emissao (data_emissao),
  INDEX idx_nf_numero (numero),
  INDEX idx_nf_boleto_id (boleto_id),
  
  -- Foreign keys
  CONSTRAINT fk_nf_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_nf_boleto FOREIGN KEY (boleto_id) REFERENCES boletos(id) ON DELETE SET NULL
);

-- Tabela de configuracao fiscal (servico padrao, impostos padrao)
CREATE TABLE IF NOT EXISTS configuracao_fiscal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  municipal_service_id VARCHAR(50),
  municipal_service_code VARCHAR(20),
  municipal_service_name VARCHAR(500),
  descricao_servico_padrao TEXT,
  iss_percentual DECIMAL(5,2) DEFAULT 5.00,
  cofins_percentual DECIMAL(5,2) DEFAULT 0.00,
  csll_percentual DECIMAL(5,2) DEFAULT 0.00,
  inss_percentual DECIMAL(5,2) DEFAULT 0.00,
  ir_percentual DECIMAL(5,2) DEFAULT 0.00,
  pis_percentual DECIMAL(5,2) DEFAULT 0.00,
  reter_iss TINYINT(1) DEFAULT 0,
  emissao_automatica TINYINT(1) DEFAULT 0,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir configuracao fiscal padrao
INSERT INTO configuracao_fiscal (
  municipal_service_id,
  municipal_service_code,
  municipal_service_name,
  descricao_servico_padrao,
  iss_percentual
) VALUES (
  '07498',
  '14.01',
  'Conserto, restauracao, manutencao e conservacao de maquinas, equipamentos, elevadores e congeneres',
  'Servicos de conserto, restauracao, manutencao e conservacao de maquinas, equipamentos, elevadores e congeneres',
  5.00
);

-- Adicionar campo nota_fiscal_id na tabela de boletos para vinculo
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS nota_fiscal_id INT;
ALTER TABLE boletos ADD INDEX IF NOT EXISTS idx_boleto_nf (nota_fiscal_id);
