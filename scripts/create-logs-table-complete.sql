-- Remover tabela se existir e recriar
DROP TABLE IF EXISTS logs_sistema;

-- Criar tabela de logs do sistema
CREATE TABLE logs_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  usuario_nome VARCHAR(200) NULL,
  usuario_email VARCHAR(200) NULL,
  acao VARCHAR(100) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'info',
  detalhes TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  sessao_id VARCHAR(100) NULL,
  tempo_sessao INT NULL,
  dados_anteriores LONGTEXT NULL,
  dados_novos LONGTEXT NULL,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_logs_usuario (usuario_id),
  INDEX idx_logs_acao (acao),
  INDEX idx_logs_modulo (modulo),
  INDEX idx_logs_tipo (tipo),
  INDEX idx_logs_data (data_hora)
);

-- Inserir logs de exemplo para teste
INSERT INTO logs_sistema (
  usuario_id, usuario_nome, usuario_email, acao, modulo, tipo, 
  detalhes, ip_address, user_agent, sessao_id, tempo_sessao, data_hora
) VALUES 
(1, 'Administrador', 'admin@sistema.com', 'Login realizado', 'Autenticação', 'login', 
 'Login bem-sucedido no sistema', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_1234567890_abc123', NULL, NOW()),
 
(1, 'Administrador', 'admin@sistema.com', 'Cliente criado', 'Clientes', 'create', 
 'Novo cliente: Empresa ABC Ltda', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_1234567890_abc123', NULL, NOW() - INTERVAL 5 MINUTE),
 
(1, 'Administrador', 'admin@sistema.com', 'Orçamento editado', 'Orçamentos', 'update', 
 'Orçamento 001 foi atualizado', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_1234567890_abc123', NULL, NOW() - INTERVAL 10 MINUTE),
 
(1, 'Administrador', 'admin@sistema.com', 'Logout realizado', 'Autenticação', 'logout', 
 'Usuário fez logout do sistema', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_1234567890_abc123', 3600, NOW() - INTERVAL 15 MINUTE),

(2, 'João Silva', 'joao@empresa.com', 'Login realizado', 'Autenticação', 'login', 
 'Login bem-sucedido no sistema', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_9876543210_def456', NULL, NOW() - INTERVAL 30 MINUTE),
 
(2, 'João Silva', 'joao@empresa.com', 'Produto criado', 'Produtos', 'create', 
 'Novo produto: Parafuso M6', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_9876543210_def456', NULL, NOW() - INTERVAL 35 MINUTE),
 
(2, 'João Silva', 'joao@empresa.com', 'Logout realizado', 'Autenticação', 'logout', 
 'Usuário fez logout do sistema', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'sess_9876543210_def456', 1800, NOW() - INTERVAL 45 MINUTE),

(NULL, 'Sistema', NULL, 'Erro de conexão', 'Sistema', 'error', 
 'Falha na conexão com o banco de dados', 'localhost', 'Sistema', NULL, NULL, NOW() - INTERVAL 60 MINUTE),
 
(1, 'Administrador', 'admin@sistema.com', 'Tentativa de acesso negada', 'Autenticação', 'warning', 
 'Senha incorreta para usuário admin@sistema.com', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NULL, NULL, NOW() - INTERVAL 90 MINUTE);

-- Verificar se os dados foram inseridos
SELECT COUNT(*) as total_logs FROM logs_sistema;
SELECT * FROM logs_sistema ORDER BY data_hora DESC LIMIT 5;
