-- Verificar se os campos da administradora existem na tabela clientes
DESCRIBE clientes;

-- Se os campos não existirem, este comando irá falhar
SELECT nome_adm, contato_adm, telefone_adm, email_adm FROM clientes LIMIT 1;

-- Verificar alguns registros com dados da administradora
SELECT 
  id,
  nome,
  nome_adm,
  contato_adm,
  telefone_adm,
  email_adm
FROM clientes 
WHERE nome_adm IS NOT NULL 
   OR contato_adm IS NOT NULL 
   OR telefone_adm IS NOT NULL 
   OR email_adm IS NOT NULL
LIMIT 10;
