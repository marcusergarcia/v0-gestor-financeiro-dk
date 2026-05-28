-- Corrigir fuso horário dos logs existentes
-- Converter de UTC para horário de Brasília (GMT-3)

-- Primeiro, vamos ver os horários atuais
SELECT 
  id,
  data_hora as horario_utc,
  CONVERT_TZ(data_hora, '+00:00', '-03:00') as horario_brasilia,
  DATE_FORMAT(CONVERT_TZ(data_hora, '+00:00', '-03:00'), '%d/%m/%Y %H:%i:%s') as formatado_brasilia
FROM logs_sistema 
ORDER BY data_hora DESC 
LIMIT 10;

-- Atualizar todos os registros para o horário correto do Brasil
-- ATENÇÃO: Este comando irá alterar permanentemente os horários
UPDATE logs_sistema 
SET data_hora = CONVERT_TZ(data_hora, '+00:00', '-03:00')
WHERE data_hora IS NOT NULL;

-- Verificar se a atualização funcionou
SELECT 
  id,
  acao,
  data_hora,
  DATE_FORMAT(data_hora, '%d/%m/%Y %H:%i:%s') as data_formatada
FROM logs_sistema 
ORDER BY data_hora DESC 
LIMIT 10;

-- Mostrar estatísticas
SELECT 
  COUNT(*) as total_logs_atualizados,
  MIN(data_hora) as primeiro_log,
  MAX(data_hora) as ultimo_log
FROM logs_sistema;
