-- Script para otimizar configurações do MySQL relacionadas a conexões

-- Configurações de timeout (em segundos)
SET GLOBAL wait_timeout = 600;           -- 10 minutos
SET GLOBAL interactive_timeout = 600;    -- 10 minutos
SET GLOBAL net_read_timeout = 60;        -- 1 minuto
SET GLOBAL net_write_timeout = 60;       -- 1 minuto

-- Configurações de buffer e cache
SET GLOBAL query_cache_size = 67108864;  -- 64MB
SET GLOBAL query_cache_limit = 2097152;  -- 2MB
SET GLOBAL table_open_cache = 2000;      -- Aumentar cache de tabelas

-- Configurações de thread
SET GLOBAL thread_cache_size = 50;       -- Cache de threads

-- Verificar as alterações
SELECT 
    @@wait_timeout,
    @@interactive_timeout,
    @@net_read_timeout,
    @@net_write_timeout,
    @@query_cache_size,
    @@query_cache_limit,
    @@table_open_cache,
    @@thread_cache_size;

-- Para tornar permanente, adicione ao my.cnf ou my.ini:
-- [mysqld]
-- max_connections = 500
-- max_user_connections = 200
-- wait_timeout = 600
-- interactive_timeout = 600
-- net_read_timeout = 60
-- net_write_timeout = 60
-- query_cache_size = 67108864
-- query_cache_limit = 2097152
-- table_open_cache = 2000
-- thread_cache_size = 50
