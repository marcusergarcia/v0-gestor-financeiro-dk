-- Script para verificar os campos atuais da tabela orcamentos
-- Execute este script primeiro para verificar quais campos existem

DESCRIBE orcamentos;

-- Ou use este comando alternativo:
SHOW COLUMNS FROM orcamentos;

-- Verificar se existem dados nos campos que serão removidos
SELECT 
  COUNT(*) as total_registros,
  COUNT(duracao) as tem_duracao,
  COUNT(tempo_inicio) as tem_tempo_inicio,
  COUNT(taxa_boleto) as tem_taxa_boleto,
  COUNT(juros_mensal) as tem_juros_mensal,
  COUNT(desconto_mao_obra) as tem_desconto_mao_obra,
  COUNT(taxa_bancaria) as tem_taxa_bancaria,
  COUNT(total_mao_obra_calculado) as tem_total_mao_obra_calculado,
  COUNT(parcelas) as tem_parcelas
FROM orcamentos;
