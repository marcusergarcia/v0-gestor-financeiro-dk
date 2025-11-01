-- Script para aumentar o limite de conexões do MySQL para 200
-- Execute este script como administrador do MySQL

-- Verificar configurações atuais
SELECT @@max_connections AS max_connections_global, 
       @@max_user_connections AS max_user_connections_global;

-- Aumentar o limite global de conexões para 500 (recomendado ser maior que max_user_connections)
SET GLOBAL max_connections = 500;

-- Aumentar o limite de conexões por usuário para 200
SET GLOBAL max_user_connections = 200;

-- Verificar se as alterações foram aplicadas
SELECT @@max_connections AS new_max_connections, 
       @@max_user_connections AS new_max_user_connections;

-- Mostrar status atual das conexões
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Threads_connected';

-- Para tornar as alterações permanentes, adicione estas linhas ao arquivo my.cnf ou my.ini:
-- [mysqld]
-- max_connections = 500
-- max_user_connections = 200
