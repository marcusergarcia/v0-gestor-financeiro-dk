-- CORREÇÃO 6: Índices para otimização de performance

-- Índices para tabela clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_tem_contrato ON clientes(tem_contrato);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade_estado ON clientes(cidade, estado);

-- Índices para tabela produtos
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_descricao ON produtos(descricao);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos(marca);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque ON produtos(estoque);
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm);

-- Índices para tabela orcamentos
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_situacao ON orcamentos(situacao);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos(data_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_valor_total ON orcamentos(valor_total);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON orcamentos(created_at);

-- Índices para tabela orcamentos_itens
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_orcamento ON orcamentos_itens(orcamento_numero);
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_produto ON orcamentos_itens(produto_id);

-- Índices para tabela boletos
CREATE INDEX IF NOT EXISTS idx_boletos_numero ON boletos(numero);
CREATE INDEX IF NOT EXISTS idx_boletos_cliente_id ON boletos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_vencimento ON boletos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_boletos_pagamento ON boletos(data_pagamento);

-- Índices para tabela contratos_conservacao
CREATE INDEX IF NOT EXISTS idx_contratos_numero ON contratos_conservacao(numero);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON contratos_conservacao(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos_conservacao(status);
CREATE INDEX IF NOT EXISTS idx_contratos_data_inicio ON contratos_conservacao(data_inicio);
CREATE INDEX IF NOT EXISTS idx_contratos_data_fim ON contratos_conservacao(data_fim);

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_situacao ON orcamentos(cliente_id, situacao);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_situacao ON orcamentos(data_orcamento, situacao);
CREATE INDEX IF NOT EXISTS idx_boletos_cliente_status ON boletos(cliente_id, status);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo_ativo ON produtos(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_marca_ativo ON produtos(marca, ativo);

-- Índices para campos de busca textual (FULLTEXT)
-- Nota: Requer MySQL 5.6+ e engine InnoDB
ALTER TABLE clientes ADD FULLTEXT(nome, endereco);
ALTER TABLE produtos ADD FULLTEXT(descricao, observacoes);
