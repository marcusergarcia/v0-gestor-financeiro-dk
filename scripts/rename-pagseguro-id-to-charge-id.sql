-- Renomeia a coluna pagseguro_id para charge_id seguindo as recomendações do PagBank
ALTER TABLE boletos 
CHANGE COLUMN pagseguro_id charge_id VARCHAR(255);
