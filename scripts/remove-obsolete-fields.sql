-- Script para remover campos obsoletos da tabela orcamentos
-- Estes campos foram substituídos por outros com melhor funcionalidade

-- Verificar se os campos existem antes de tentar removê-los
-- Remover campo 'duracao' (substituído por 'prazo_dias')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS duracao;

-- Remover campo 'tempo_inicio' (substituído por 'data_inicio')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS tempo_inicio;

-- Remover campo 'desconto' antigo (agora temos desconto como decimal simples)
-- Verificar se existe um campo desconto diferente do atual
-- ALTER TABLE orcamentos DROP COLUMN IF EXISTS desconto_old;

-- Remover campo 'taxa_boleto' (substituído por 'valor_boleto')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS taxa_boleto;

-- Remover campo 'juros_mensal' (substituído por 'juros_am')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS juros_mensal;

-- Remover campo 'desconto_mao_obra' (substituído por 'desconto_mdo_percent' e 'desconto_mdo_valor')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS desconto_mao_obra;

-- Remover campo 'taxa_bancaria' (não utilizado no sistema atual)
ALTER TABLE orcamentos DROP COLUMN IF EXISTS taxa_bancaria;

-- Remover campo 'total_mao_obra_calculado' (substituído por 'subtotal_mdo')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS total_mao_obra_calculado;

-- Remover campo 'validade' se for do tipo date (substituído por validade como integer)
-- Primeiro verificar o tipo do campo validade atual
-- Se for date, remover e recriar como integer
-- ALTER TABLE orcamentos DROP COLUMN IF EXISTS validade_old;

-- Remover campo 'parcelas' (substituído por 'parcelamento_mdo' e 'parcelamento_material')
ALTER TABLE orcamentos DROP COLUMN IF EXISTS parcelas;

-- Adicionar comentário para documentar as mudanças
-- Os campos removidos foram substituídos pelos seguintes:
-- duracao -> prazo_dias
-- tempo_inicio -> data_inicio  
-- taxa_boleto -> valor_boleto
-- juros_mensal -> juros_am
-- desconto_mao_obra -> desconto_mdo_percent + desconto_mdo_valor
-- total_mao_obra_calculado -> subtotal_mdo
-- parcelas -> parcelamento_mdo + parcelamento_material
-- taxa_bancaria -> removido (não utilizado)
