-- Verificar estrutura da tabela orcamentos_itens
DESCRIBE orcamentos_itens;

-- Verificar estrutura da tabela proposta_itens  
DESCRIBE proposta_itens;

-- Verificar estrutura da tabela produtos
DESCRIBE produtos;

-- Verificar estrutura da tabela tipos_produtos
DESCRIBE tipos_produtos;

-- Verificar estrutura da tabela marcas
DESCRIBE marcas;

-- Verificar alguns dados de exemplo
SELECT 'PRODUTOS' as tabela, COUNT(*) as total FROM produtos;
SELECT 'CATEGORIAS' as tabela, COUNT(*) as total FROM tipos_produtos;
SELECT 'MARCAS' as tabela, COUNT(*) as total FROM marcas;

-- Verificar se há produtos com categoria e marca
SELECT 
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN tipo IS NOT NULL AND tipo != '' THEN 1 END) as com_categoria,
  COUNT(CASE WHEN marca IS NOT NULL AND marca != '' THEN 1 END) as com_marca
FROM produtos;

-- Mostrar alguns exemplos de produtos
SELECT id, codigo, descricao, tipo, marca FROM produtos LIMIT 5;
