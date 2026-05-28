-- Adicionar campo data_nota e descricao_produto na tabela boletos (MySQL)
ALTER TABLE boletos 
ADD COLUMN data_nota DATE COMMENT 'Data da nota fiscal relacionada ao boleto';

ALTER TABLE boletos 
ADD COLUMN descricao_produto VARCHAR(255) COMMENT 'Descrição do produto/serviço para o PagBank';
