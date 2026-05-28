-- Adicionar 'gerente' ao enum do campo responsavel na tabela ordens_servico
ALTER TABLE ordens_servico 
MODIFY COLUMN responsavel ENUM('zelador', 'porteiro', 'sindico', 'gerente', 'outros');
