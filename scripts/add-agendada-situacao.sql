-- Adicionar 'agendada' ao enum situacao da tabela ordens_servico
ALTER TABLE ordens_servico 
MODIFY COLUMN situacao ENUM('rascunho', 'aberta', 'agendada', 'em_andamento', 'concluida', 'cancelada') 
DEFAULT 'rascunho';
