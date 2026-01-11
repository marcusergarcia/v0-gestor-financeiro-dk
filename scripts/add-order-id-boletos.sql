-- Adiciona coluna order_id para armazenar o ID do pedido (ORDE_XXXX) retornado pelo PagBank
-- Isso permite identificar boletos tanto pelo order_id quanto pelo charge_id (pagseguro_id)

ALTER TABLE boletos 
ADD COLUMN order_id VARCHAR(100) NULL AFTER pagseguro_id,
ADD INDEX idx_order_id (order_id);

-- Comentários sobre os campos
-- pagseguro_id: armazena o charge_id (CHAR_XXXX) 
-- order_id: armazena o order_id (ORDE_XXXX)
