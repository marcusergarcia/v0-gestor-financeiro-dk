-- Adicionar 'pendente' ao ENUM de situacao da tabela ordens_servico_itens
-- Isso é necessário porque o código utiliza 'pendente' como valor inicial dos equipamentos

ALTER TABLE ordens_servico_itens 
MODIFY COLUMN situacao ENUM('pendente', 'ok', 'defeito', 'manutencao', 'substituido') 
DEFAULT 'pendente';

-- Verificar a alteração
DESCRIBE ordens_servico_itens;
