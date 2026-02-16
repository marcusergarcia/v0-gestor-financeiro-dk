-- Tabela de configuração NF-e (Nota Fiscal Eletrônica de Produto - SEFAZ)
CREATE TABLE IF NOT EXISTS nfe_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Dados do emitente
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(14) NOT NULL,
  inscricao_estadual VARCHAR(20) NOT NULL,
  -- Endereço do emitente
  endereco VARCHAR(255),
  numero_endereco VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100) DEFAULT 'São Paulo',
  uf VARCHAR(2) DEFAULT 'SP',
  cep VARCHAR(8),
  codigo_municipio VARCHAR(7) DEFAULT '3550308',
  codigo_uf VARCHAR(2) DEFAULT '35',
  telefone VARCHAR(20),
  -- Regime tributário
  crt TINYINT DEFAULT 1 COMMENT '1=Simples Nacional, 2=Simples Nacional excesso sublimite, 3=Regime Normal',
  -- Numeração
  serie_nfe INT DEFAULT 1 COMMENT 'Série da NF-e',
  proximo_numero_nfe INT DEFAULT 1 COMMENT 'Próximo número da NF-e',
  -- Ambiente
  ambiente TINYINT DEFAULT 2 COMMENT '1=Produção, 2=Homologação',
  -- Certificado digital (reutiliza da NFS-e, mas mantém referência)
  usar_certificado_nfse TINYINT(1) DEFAULT 1 COMMENT '1=Usar mesmo certificado da NFS-e',
  -- Informações complementares padrão
  info_complementar TEXT DEFAULT 'Documento emitido por ME ou EPP optante pelo SIMPLES NACIONAL conforme LC 123/2006. Não gera direito a crédito fiscal de IPI.',
  -- Natureza da operação padrão
  natureza_operacao VARCHAR(100) DEFAULT 'Venda',
  -- Controle
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de NF-e emitidas (notas de material/produto)
CREATE TABLE IF NOT EXISTS nfe_emitidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Identificação
  numero_nfe INT COMMENT 'Número da NF-e',
  serie INT DEFAULT 1,
  chave_acesso VARCHAR(44) COMMENT 'Chave de acesso da NF-e (44 dígitos)',
  protocolo VARCHAR(20) COMMENT 'Protocolo de autorização',
  -- Origem
  origem VARCHAR(30) NOT NULL DEFAULT 'orcamento' COMMENT 'orcamento, avulsa',
  origem_id INT COMMENT 'ID do registro de origem',
  origem_numero VARCHAR(50) COMMENT 'Número do registro de origem',
  -- Emitente
  emitente_cnpj VARCHAR(14) NOT NULL,
  emitente_ie VARCHAR(20) NOT NULL,
  -- Destinatário
  cliente_id INT,
  dest_tipo VARCHAR(2) NOT NULL DEFAULT 'PJ' COMMENT 'PF ou PJ',
  dest_cpf_cnpj VARCHAR(14) NOT NULL,
  dest_razao_social VARCHAR(255) NOT NULL,
  dest_email VARCHAR(255),
  dest_telefone VARCHAR(20),
  dest_inscricao_estadual VARCHAR(20),
  dest_ind_ie_dest TINYINT DEFAULT 9 COMMENT '1=Contribuinte ICMS, 2=Contribuinte isento, 9=Não contribuinte',
  -- Endereço do destinatário
  dest_endereco VARCHAR(255),
  dest_numero VARCHAR(20),
  dest_complemento VARCHAR(100),
  dest_bairro VARCHAR(100),
  dest_cidade VARCHAR(100),
  dest_uf VARCHAR(2),
  dest_cep VARCHAR(8),
  dest_codigo_municipio VARCHAR(7),
  -- Valores totais
  valor_produtos DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_frete DECIMAL(15,2) DEFAULT 0,
  valor_seguro DECIMAL(15,2) DEFAULT 0,
  valor_desconto DECIMAL(15,2) DEFAULT 0,
  valor_outras_despesas DECIMAL(15,2) DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  -- Informações complementares
  info_complementar TEXT,
  natureza_operacao VARCHAR(100) DEFAULT 'Venda',
  -- Transporte
  modalidade_frete TINYINT DEFAULT 9 COMMENT '0=CIF, 1=FOB, 2=Terceiros, 9=Sem Frete',
  -- Pagamento
  forma_pagamento TINYINT DEFAULT 0 COMMENT '0=À vista, 1=A prazo',
  meio_pagamento VARCHAR(5) DEFAULT '15' COMMENT '01=Dinheiro, 02=Cheque, 03=Cartão Crédito, 04=Cartão Débito, 05=Crédito Loja, 10=VA, 11=VR, 12=Vale Presente, 13=Vale Combustível, 14=Duplicata Mercantil, 15=Boleto Bancário, 90=Sem Pagamento, 99=Outros',
  -- Status
  status VARCHAR(30) DEFAULT 'pendente' COMMENT 'pendente, processando, autorizada, cancelada, erro, rejeitada',
  data_emissao DATETIME COMMENT 'Data/hora de emissão',
  data_autorizacao DATETIME COMMENT 'Data/hora de autorização',
  data_cancelamento DATETIME,
  motivo_cancelamento TEXT,
  -- XML
  xml_envio LONGTEXT COMMENT 'XML da NF-e enviada',
  xml_retorno LONGTEXT COMMENT 'XML de retorno da SEFAZ',
  xml_protocolo LONGTEXT COMMENT 'XML do protocolo (nfeProc)',
  -- Erros
  codigo_erro VARCHAR(20),
  mensagem_erro TEXT,
  -- Controle
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Índices
  INDEX idx_numero_nfe (numero_nfe),
  INDEX idx_chave_acesso (chave_acesso),
  INDEX idx_status (status),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_origem (origem, origem_id),
  INDEX idx_data_emissao (data_emissao),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de itens da NF-e
CREATE TABLE IF NOT EXISTS nfe_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nfe_id INT NOT NULL,
  numero_item INT NOT NULL COMMENT 'Número sequencial do item (1, 2, 3...)',
  -- Produto
  produto_id INT,
  codigo_produto VARCHAR(60) NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  ncm VARCHAR(8) NOT NULL DEFAULT '00000000',
  cfop VARCHAR(4) NOT NULL DEFAULT '5102',
  unidade VARCHAR(6) NOT NULL DEFAULT 'UN',
  -- Valores
  quantidade DECIMAL(15,4) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(15,4) NOT NULL DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  -- ICMS Simples Nacional
  origem TINYINT DEFAULT 0 COMMENT '0=Nacional',
  csosn VARCHAR(4) DEFAULT '102' COMMENT '102=Tributada sem permissão de crédito',
  -- Controle
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nfe_id (nfe_id),
  FOREIGN KEY (nfe_id) REFERENCES nfe_emitidas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de log de transmissões NF-e
CREATE TABLE IF NOT EXISTS nfe_transmissoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nfe_id INT NOT NULL,
  tipo VARCHAR(30) NOT NULL COMMENT 'autorizacao, consulta_recibo, consulta_protocolo, cancelamento, inutilizacao',
  xml_envio LONGTEXT,
  xml_retorno LONGTEXT,
  sucesso TINYINT(1) DEFAULT 0,
  codigo_status VARCHAR(10),
  mensagem_status TEXT,
  tempo_resposta_ms INT COMMENT 'Tempo de resposta em milissegundos',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nfe_id (nfe_id),
  FOREIGN KEY (nfe_id) REFERENCES nfe_emitidas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
