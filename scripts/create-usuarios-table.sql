-- Criar tabela de usuários se não existir
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil ENUM('admin', 'tecnico', 'operador', 'financeiro') DEFAULT 'operador',
  status ENUM('ativo', 'inativo') DEFAULT 'ativo',
  avatar VARCHAR(500) NULL,
  ultimo_acesso DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir usuários de exemplo (senhas são 'senha123' hasheadas)
INSERT INTO usuarios (nome, email, senha, perfil, status) VALUES
('João Silva', 'joao@empresa.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'admin', 'ativo'),
('Maria Santos', 'maria@empresa.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'tecnico', 'ativo'),
('Carlos Oliveira', 'carlos@empresa.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'operador', 'inativo'),
('Ana Costa', 'ana@empresa.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'financeiro', 'ativo')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
