-- Corrigir estrutura da tabela marcas para usar AUTO_INCREMENT

-- Backup dos dados existentes
CREATE TABLE IF NOT EXISTS marcas_backup AS SELECT * FROM marcas;

-- Recriar a tabela com a estrutura correta
DROP TABLE IF EXISTS marcas;

CREATE TABLE marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  sigla VARCHAR(10),
  contador INT(11) DEFAULT 0,
  descricao TEXT,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marcas_nome (nome),
  INDEX idx_marcas_sigla (sigla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restaurar dados do backup (se houver)
INSERT INTO marcas (nome, sigla, contador, descricao, ativo, created_at, updated_at)
SELECT nome, sigla, contador, descricao, ativo, created_at, updated_at
FROM marcas_backup
WHERE nome IS NOT NULL AND nome != '';

-- Limpar backup
DROP TABLE IF EXISTS marcas_backup;

-- Resetar o AUTO_INCREMENT para começar do próximo número disponível
ALTER TABLE marcas AUTO_INCREMENT = 1;
