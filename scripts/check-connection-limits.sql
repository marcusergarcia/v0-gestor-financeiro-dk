-- Script para verificar os limites e uso atual de conexões

-- Verificar configurações atuais
SELECT 
    @@max_connections AS max_connections_global,
    @@max_user_connections AS max_user_connections_global,
    @@wait_timeout AS wait_timeout,
    @@interactive_timeout AS interactive_timeout;

-- Verificar status das conexões
SELECT 
    VARIABLE_NAME,
    VARIABLE_VALUE
FROM INFORMATION_SCHEMA.GLOBAL_STATUS 
WHERE VARIABLE_NAME IN (
    'Connections',
    'Max_used_connections',
    'Threads_connected',
    'Threads_running',
    'Aborted_connects',
    'Aborted_clients'
);

-- Verificar conexões ativas por usuário
SELECT 
    USER,
    HOST,
    COUNT(*) as connection_count
FROM INFORMATION_SCHEMA.PROCESSLIST 
GROUP BY USER, HOST
ORDER BY connection_count DESC;

-- Verificar conexões por estado
SELECT 
    COMMAND,
    STATE,
    COUNT(*) as count
FROM INFORMATION_SCHEMA.PROCESSLIST 
GROUP BY COMMAND, STATE
ORDER BY count DESC;
