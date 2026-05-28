-- Adicionar campos da administradora na tabela clientes
ALTER TABLE clientes 
ADD COLUMN nome_adm VARCHAR(255) NULL COMMENT 'Nome da administradora',
ADD COLUMN contato_adm VARCHAR(255) NULL COMMENT 'Pessoa de contato da administradora',
ADD COLUMN telefone_adm VARCHAR(20) NULL COMMENT 'Telefone da administradora',
ADD COLUMN email_adm VARCHAR(255) NULL COMMENT 'Email da administradora';

-- Verificar se os campos foram adicionados
DESCRIBE clientes;

-- Mostrar alguns registros para verificar a estrutura
SELECT 
  id, 
  nome, 
  nome_adm, 
  contato_adm, 
  telefone_adm, 
  email_adm 
FROM clientes 
LIMIT 5;
