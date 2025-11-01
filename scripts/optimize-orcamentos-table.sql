-- Otimizar tabela de orçamentos para melhor performance
-- Adicionar índices para consultas mais rápidas

-- Índice para busca por data de criação (usado na geração de números)
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON orcamentos(created_at);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);

-- Índice para busca por número
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero);

-- Índice para busca por situação
CREATE INDEX IF NOT EXISTS idx_orcamentos_situacao ON orcamentos(situacao);

-- Índice composto para otimizar a query de próximo número
CREATE INDEX IF NOT EXISTS idx_orcamentos_date_created ON orcamentos(DATE(created_at));

-- Otimizar tabela de itens
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_numero ON orcamentos_itens(orcamento_numero);
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_produto ON orcamentos_itens(produto_id);

-- Verificar se as tabelas têm os campos necessários
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE orcamentos_itens 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
