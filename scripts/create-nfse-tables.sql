-- Tabela de configuração NFS-e
CREATE TABLE IF NOT EXISTS nfse_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Dados do prestador
  inscricao_municipal VARCHAR(20) NOT NULL,
  razao_social VARCHAR(255) NOT NULL,
  cnpj VARCHAR(14) NOT NULL,
  -- Endereço do prestador
  endereco VARCHAR(255),
  numero_endereco VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100) DEFAULT 'SAO PAULO',
  uf VARCHAR(2) DEFAULT 'SP',
  cep VARCHAR(8),
  codigo_municipio VARCHAR(7) DEFAULT '3550308',
  -- Dados fiscais
  codigo_servico VARCHAR(10) NOT NULL COMMENT 'Código do serviço na lista da LC 116/2003',
  descricao_servico TEXT COMMENT 'Descrição padrão do serviço',
  aliquota_iss DECIMAL(5,4) DEFAULT 0.0500 COMMENT 'Alíquota ISS (ex: 0.05 = 5%)',
  codigo_cnae VARCHAR(10) COMMENT 'Código CNAE da atividade',
  regime_tributacao TINYINT DEFAULT 1 COMMENT '1-Microempresa Municipal, 2-Estimativa, 3-Sociedade Profissionais, 4-Cooperativa, 5-MEI, 6-ME/EPP Simples Nacional',
  optante_simples TINYINT(1) DEFAULT 0 COMMENT '1=Optante, 2=Não optante',
  incentivador_cultural TINYINT(1) DEFAULT 0 COMMENT '1=Sim, 2=Não',
  -- Certificado digital
  certificado_base64 LONGTEXT COMMENT 'Certificado A1 em base64',
  certificado_senha VARCHAR(255) COMMENT 'Senha do certificado (encriptada)',
  certificado_validade DATE COMMENT 'Data de validade do certificado',
  -- Configurações do webservice
  ambiente TINYINT DEFAULT 2 COMMENT '1=Produção, 2=Homologação',
  serie_rps VARCHAR(10) DEFAULT '11' COMMENT 'Serie do RPS',
  tipo_rps TINYINT DEFAULT 1 COMMENT '1=RPS, 2=RPS-Mista, 3=Cupom',
  proximo_numero_rps INT DEFAULT 732 COMMENT 'Proximo numero do RPS',
  -- Controle
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela principal de notas fiscais emitidas
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Identificação
  numero_nfse VARCHAR(20) COMMENT 'Número da NFS-e retornado pela prefeitura',
  numero_rps INT NOT NULL COMMENT 'Número do RPS enviado',
  serie_rps VARCHAR(10) DEFAULT 'NF',
  tipo_rps TINYINT DEFAULT 1,
  codigo_verificacao VARCHAR(50) COMMENT 'Código de verificação da NFS-e',
  -- Origem
  origem VARCHAR(30) NOT NULL COMMENT 'orcamento, ordem_servico, boleto, avulsa',
  origem_id INT COMMENT 'ID do registro de origem',
  origem_numero VARCHAR(50) COMMENT 'Número do registro de origem',
  -- Prestador
  prestador_cnpj VARCHAR(14) NOT NULL,
  prestador_inscricao_municipal VARCHAR(20) NOT NULL,
  -- Tomador (cliente)
  cliente_id INT,
  tomador_tipo VARCHAR(2) NOT NULL COMMENT 'PF ou PJ',
  tomador_cpf_cnpj VARCHAR(14) NOT NULL,
  tomador_inscricao_municipal VARCHAR(20),
  tomador_razao_social VARCHAR(255) NOT NULL,
  tomador_email VARCHAR(255),
  tomador_telefone VARCHAR(20),
  -- Endereço do tomador
  tomador_endereco VARCHAR(255),
  tomador_numero VARCHAR(20),
  tomador_complemento VARCHAR(100),
  tomador_bairro VARCHAR(100),
  tomador_cidade VARCHAR(100),
  tomador_uf VARCHAR(2),
  tomador_cep VARCHAR(8),
  tomador_codigo_municipio VARCHAR(7),
  -- Serviço
  codigo_servico VARCHAR(10) NOT NULL,
  descricao_servico TEXT NOT NULL,
  codigo_cnae VARCHAR(10),
  -- Valores
  valor_servicos DECIMAL(15,2) NOT NULL,
  valor_deducoes DECIMAL(15,2) DEFAULT 0.00,
  valor_pis DECIMAL(15,2) DEFAULT 0.00,
  valor_cofins DECIMAL(15,2) DEFAULT 0.00,
  valor_inss DECIMAL(15,2) DEFAULT 0.00,
  valor_ir DECIMAL(15,2) DEFAULT 0.00,
  valor_csll DECIMAL(15,2) DEFAULT 0.00,
  valor_iss DECIMAL(15,2) DEFAULT 0.00,
  aliquota_iss DECIMAL(5,4) DEFAULT 0.0500,
  iss_retido TINYINT(1) DEFAULT 0 COMMENT '1=ISS retido pelo tomador, 0=Não retido',
  valor_total DECIMAL(15,2) NOT NULL,
  -- Status
  status VARCHAR(30) DEFAULT 'pendente' COMMENT 'pendente, processando, emitida, cancelada, erro',
  data_emissao DATETIME COMMENT 'Data/hora de emissão da NFS-e',
  data_cancelamento DATETIME,
  motivo_cancelamento TEXT,
  -- XML
  xml_envio LONGTEXT COMMENT 'XML do RPS enviado à prefeitura',
  xml_retorno LONGTEXT COMMENT 'XML de retorno da prefeitura',
  -- Erros
  codigo_erro VARCHAR(20),
  mensagem_erro TEXT,
  -- Controle
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Índices
  INDEX idx_numero_nfse (numero_nfse),
  INDEX idx_numero_rps (numero_rps),
  INDEX idx_status (status),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_origem (origem, origem_id),
  INDEX idx_data_emissao (data_emissao),
  INDEX idx_prestador_cnpj (prestador_cnpj),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de log de transmissões
CREATE TABLE IF NOT EXISTS nfse_transmissoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nota_fiscal_id INT NOT NULL,
  tipo VARCHAR(30) NOT NULL COMMENT 'envio_rps, consulta, cancelamento, teste',
  xml_envio LONGTEXT,
  xml_retorno LONGTEXT,
  sucesso TINYINT(1) DEFAULT 0,
  codigo_erro VARCHAR(20),
  mensagem_erro TEXT,
  tempo_resposta_ms INT COMMENT 'Tempo de resposta em milissegundos',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nota_fiscal_id (nota_fiscal_id),
  FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
