-- Adicionar campos de latitude e longitude na tabela clientes
ALTER TABLE clientes 
ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER distancia_km,
ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Adicionar índice para busca por localização
CREATE INDEX idx_clientes_coordenadas ON clientes(latitude, longitude);
