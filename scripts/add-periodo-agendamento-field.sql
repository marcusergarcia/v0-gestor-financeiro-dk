-- Adicionar campo periodo_agendamento na tabela ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN periodo_agendamento ENUM('manha', 'tarde') NULL AFTER data_agendamento;

-- Adicionar comentário explicativo
ALTER TABLE ordens_servico 
MODIFY COLUMN periodo_agendamento ENUM('manha', 'tarde') NULL COMMENT 'Período do agendamento: manhã ou tarde';
