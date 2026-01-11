-- Script para remover completamente o sistema de cashback e tabelas relacionadas

-- Remover foreign keys da tabela cashback
ALTER TABLE cashback DROP FOREIGN KEY IF EXISTS cashback_ibfk_1;
ALTER TABLE cashback DROP FOREIGN KEY IF EXISTS cashback_ibfk_2;

-- Remover tabelas
DROP TABLE IF EXISTS cashback;
DROP TABLE IF EXISTS pagamentos_payout;

-- Remover tabela de configurações do PagSeguro (se não for usada para outras coisas)
DROP TABLE IF EXISTS configuracoes_pagseguro;

-- Limpar qualquer referência em outras tabelas (se existir)
-- Este comando não falhará se a coluna não existir
-- ALTER TABLE boletos DROP COLUMN IF EXISTS cashback_ativo;
