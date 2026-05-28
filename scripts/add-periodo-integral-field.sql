-- Alterar campo periodo_agendamento para incluir 'integral'
ALTER TABLE ordens_servico 
MODIFY COLUMN periodo_agendamento ENUM('manha', 'tarde', 'integral') NULL COMMENT 'Período do agendamento: manhã (9h-12h), tarde (13h-17h) ou integral (9h-17h)';
