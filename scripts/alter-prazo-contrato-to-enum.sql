-- Alterar o campo prazo_contrato na tabela proposta_contratos para VARCHAR
ALTER TABLE proposta_contratos 
MODIFY COLUMN prazo_contrato VARCHAR(20) NOT NULL DEFAULT '12';

-- Atualizar valores existentes para garantir compatibilidade
UPDATE proposta_contratos 
SET prazo_contrato = CASE 
    WHEN prazo_contrato IN ('12', '24') THEN prazo_contrato
    ELSE '12'
END;

-- Alterar o campo prazo_meses na tabela contratos_conservacao para VARCHAR
ALTER TABLE contratos_conservacao 
MODIFY COLUMN prazo_meses VARCHAR(20) NOT NULL DEFAULT '12';

-- Atualizar valores existentes para garantir compatibilidade
UPDATE contratos_conservacao 
SET prazo_meses = CASE 
    WHEN prazo_meses IN ('12', '24') THEN prazo_meses
    ELSE '12'
END;
