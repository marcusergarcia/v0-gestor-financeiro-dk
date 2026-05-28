-- Verificar se o cliente 271 existe
SELECT id, nome, tem_contrato FROM clientes WHERE id = 271;

-- Atualizar cliente 271 para ter contrato se não tiver
UPDATE clientes SET tem_contrato = 1 WHERE id = 271;

-- Verificar se já existe contrato para o cliente 271
SELECT * FROM contratos_conservacao WHERE cliente_id = 271;

-- Se não existir, inserir contrato para o cliente 271
INSERT IGNORE INTO contratos_conservacao (
  numero, 
  cliente_id, 
  data_inicio, 
  data_fim, 
  status, 
  valor_mensal, 
  observacoes, 
  equipamentos_inclusos
) VALUES (
  'CC-2024-271', 
  271, 
  '2024-01-01', 
  '2024-12-31', 
  'ativo', 
  2800.00, 
  'Contrato de conservação predial - COND. EDIF. GUAJAUNA', 
  '1,2,3,4,5,6'
);

-- Verificar equipamentos disponíveis
SELECT id, nome, categoria, ativo FROM equipamentos WHERE ativo = 1 ORDER BY nome;

-- Se não existir equipamentos suficientes, inserir mais alguns
INSERT IGNORE INTO equipamentos (nome, descricao, categoria, valor_hora, ativo) VALUES
('Elevador Social A', 'Elevador principal torre A', 'Elevadores', 150.00, 1),
('Elevador Social B', 'Elevador principal torre B', 'Elevadores', 150.00, 1),
('Elevador de Serviço', 'Elevador de carga', 'Elevadores', 120.00, 1),
('Bomba de Recalque Principal', 'Bomba principal de água', 'Hidráulica', 80.00, 1),
('Bomba de Recalque Reserva', 'Bomba reserva de água', 'Hidráulica', 80.00, 1),
('Gerador de Emergência', 'Gerador diesel 100kVA', 'Elétrica', 200.00, 1),
('Sistema de Incêndio', 'Sprinklers e hidrantes', 'Segurança', 100.00, 1),
('Portão Garagem Principal', 'Portão automático principal', 'Automação', 90.00, 1),
('Portão Garagem Visitantes', 'Portão automático visitantes', 'Automação', 90.00, 1),
('Central de Gás', 'Sistema GLP predial', 'Gás', 110.00, 1);

-- Verificar o resultado final
SELECT 
  cc.numero,
  cc.cliente_id,
  c.nome as cliente_nome,
  cc.data_inicio,
  cc.data_fim,
  cc.status,
  cc.equipamentos_inclusos
FROM contratos_conservacao cc
JOIN clientes c ON c.id = cc.cliente_id
WHERE cc.cliente_id = 271;
