-- Script para remover completamente o sistema de cashback

-- Remover constraint da tabela boletos
ALTER TABLE boletos DROP FOREIGN KEY IF EXISTS cashback_ibfk_2;

-- Remover tabela cashback
DROP TABLE IF EXISTS cashback;

-- Remover tabela pagamentos_payout
DROP TABLE IF EXISTS pagamentos_payout;

-- Remover configurações de cashback
DELETE FROM configuracoes_pagseguro WHERE chave IN ('cashback_percentual_padrao', 'cashback_ativo');
