-- Inserir equipamentos de exemplo se a tabela estiver vazia
INSERT IGNORE INTO equipamentos (nome, descricao, categoria, valor_hora, ativo) VALUES
('Ar Condicionado Split 12000 BTU', 'Equipamento de climatização residencial', 'Climatização', 45.00, 1),
('Ar Condicionado Split 18000 BTU', 'Equipamento de climatização comercial', 'Climatização', 55.00, 1),
('Ar Condicionado Split 24000 BTU', 'Equipamento de climatização industrial', 'Climatização', 65.00, 1),
('Ar Condicionado Cassete 36000 BTU', 'Equipamento de climatização para teto', 'Climatização', 75.00, 1),
('Ar Condicionado VRF', 'Sistema de climatização multi-split', 'Climatização', 120.00, 1),
('Chiller', 'Sistema de resfriamento industrial', 'Refrigeração', 200.00, 1),
('Torre de Resfriamento', 'Sistema de resfriamento de água', 'Refrigeração', 150.00, 1),
('Bomba de Calor', 'Sistema de aquecimento e resfriamento', 'Climatização', 90.00, 1),
('Unidade Condensadora', 'Equipamento externo de climatização', 'Climatização', 60.00, 1),
('Evaporadora', 'Equipamento interno de climatização', 'Climatização', 40.00, 1),
('Ventilador Industrial', 'Equipamento de ventilação industrial', 'Ventilação', 35.00, 1),
('Exaustor', 'Equipamento de exaustão de ar', 'Ventilação', 30.00, 1),
('Filtro de Ar', 'Sistema de filtragem de ar', 'Filtragem', 25.00, 1),
('Compressor', 'Equipamento de compressão de ar', 'Compressão', 80.00, 1),
('Válvula de Expansão', 'Componente do sistema de refrigeração', 'Refrigeração', 20.00, 1);

-- Verificar se os equipamentos foram inseridos
SELECT COUNT(*) as total_inserido FROM equipamentos;
