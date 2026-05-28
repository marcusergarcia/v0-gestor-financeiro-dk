-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  conteudo LONGTEXT,
  cliente_id INT,
  cliente_nome VARCHAR(200),
  cliente_endereco TEXT,
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(100),
  tipo_documento VARCHAR(50) DEFAULT 'documento',
  status VARCHAR(20) DEFAULT 'rascunho',
  tags TEXT,
  versao INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  template_usado TINYINT(1) DEFAULT 0,
  assinatura_empresa TEXT,
  data_assinatura DATE,
  observacoes TEXT,
  
  INDEX idx_codigo (codigo),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_status (status),
  INDEX idx_tipo_documento (tipo_documento),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);
