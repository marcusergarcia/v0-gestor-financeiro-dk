-- Corrigir timezone dos logs existentes
-- Assumindo que os logs foram armazenados em horário local mas estão marcados como UTC

-- Primeiro, vamos ver os dados atuais
SELECT 
  id,
  acao,
  data_hora as data_original,
  DATE_ADD(data_hora, INTERVAL 3 HOUR) as data_corrigida_utc,
  DATE_FORMAT(data_hora, '%d/%m/%Y %H:%i:%s') as formatada_original,
  DATE_FORMAT(DATE_ADD(data_hora, INTERVAL 3 HOUR), '%d/%m/%Y %H:%i:%s') as formatada_corrigida
FROM logs_sistema 
ORDER BY data_hora DESC 
LIMIT 5;

-- Se os logs foram armazenados em horário local mas estão sendo tratados como UTC,
-- precisamos adicionar 3 horas para converter para UTC real
UPDATE logs_sistema 
SET data_hora = DATE_ADD(data_hora, INTERVAL 3 HOUR)
WHERE data_hora < NOW();

-- Verificar se a correção funcionou
SELECT 
  id,
  acao,
  data_hora as data_utc,
  DATE_ADD(data_hora, INTERVAL -3 HOUR) as data_brasilia,
  DATE_FORMAT(DATE_ADD(data_hora, INTERVAL -3 HOUR), '%d/%m/%Y %H:%i:%s') as formatada_brasilia
FROM logs_sistema 
ORDER BY data_hora DESC 
LIMIT 5;
