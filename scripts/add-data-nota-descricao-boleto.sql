-- Adicionar campo data_nota e descricao_produto na tabela boletos
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS data_nota DATE;
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS descricao_produto VARCHAR(255);

-- Comentários das colunas
COMMENT ON COLUMN boletos.data_nota IS 'Data da nota fiscal relacionada ao boleto';
COMMENT ON COLUMN boletos.descricao_produto IS 'Descrição do produto/serviço para o PagBank';
