-- Criar tabela de configuração do timbrado
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
  margem_superior INT(11) DEFAULT 20,
  margem_inferior INT(11) DEFAULT 20,
  margem_esquerda INT(11) DEFAULT 20,
  margem_direita INT(11) DEFAULT 20,
  cabecalho TEXT,
  rodape TEXT,
  
  INDEX idx_ativo (ativo)
);
