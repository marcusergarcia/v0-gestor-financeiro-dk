-- Atualizar configuracao fiscal padrao com servico municipal correto
-- Servico: 07498 | 14.01 - Conserto, restauracao, manutencao e conservacao de maquinas, equipamentos, elevadores e congeneres

UPDATE configuracao_fiscal SET
  municipal_service_id = '07498',
  municipal_service_code = '14.01',
  municipal_service_name = 'Conserto, restauracao, manutencao e conservacao de maquinas, equipamentos, elevadores e congeneres',
  descricao_servico_padrao = 'Servicos de conserto, restauracao, manutencao e conservacao de maquinas, equipamentos, elevadores e congeneres',
  iss_percentual = 5.00,
  updated_at = CURRENT_TIMESTAMP
WHERE ativo = 1;
