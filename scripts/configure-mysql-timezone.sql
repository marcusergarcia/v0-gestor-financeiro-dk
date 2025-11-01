-- Configurar fuso horário do MySQL para o Brasil
-- Isso afetará todas as operações NOW(), CURRENT_TIMESTAMP, etc.

-- Verificar fuso horário atual
SELECT @@global.time_zone, @@session.time_zone;

-- Definir fuso horário da sessão para o Brasil
SET time_zone = '-03:00';

-- Verificar se mudou
SELECT @@global.time_zone, @@session.time_zone;

-- Testar com horário atual
SELECT 
  NOW() as horario_atual,
  UTC_TIMESTAMP() as horario_utc,
  CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00') as horario_brasilia;

-- Para tornar permanente, adicione no arquivo my.cnf:
-- [mysqld]
-- default-time-zone = '-03:00'
