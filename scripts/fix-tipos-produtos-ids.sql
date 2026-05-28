-- =============================================================
-- SCRIPT: Normalização dos IDs da tabela tipos_produtos
-- Problema: IDs misturados (varchar inteiro + UUID)
-- Solução: Converter todos para o valor numérico do campo `codigo`
--
-- IMPORTANTE: Execute TUDO dentro de uma transação.
-- Se algo falhar, o ROLLBACK desfaz tudo sem dano ao banco.
-- =============================================================

-- ---------------------------------------------------------------
-- PASSO 0: Diagnóstico antes da alteração
-- ---------------------------------------------------------------
SELECT 
    id,
    codigo,
    nome,
    ativo,
    CASE 
        WHEN id REGEXP '^[0-9]+$' THEN 'INTEGER'
        WHEN id REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        ELSE 'OUTRO'
    END AS tipo_id
FROM tipos_produtos
ORDER BY CAST(codigo AS UNSIGNED);

-- ---------------------------------------------------------------
-- PASSO 1: Iniciar transação segura
-- ---------------------------------------------------------------
START TRANSACTION;

-- ---------------------------------------------------------------
-- PASSO 2: Desabilitar verificação de chave estrangeira
--          (caso haja FKs apontando para tipos_produtos.id)
-- ---------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------
-- PASSO 3: Atualizar os IDs UUID para o valor numérico do código
--
-- Lógica: codigo '010' → id '10', '011' → '11', etc.
-- As categorias com id inteiro que NÃO batem com o codigo
-- (ex: id=8, codigo=018) também serão normalizadas.
-- ---------------------------------------------------------------

-- FIBRA OTICA: UUID → 10
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '010';

-- FONTES: UUID → 11
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '011';

-- INFORMATICA: UUID → 12
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '012';

-- INFRAESTRUTURA: UUID → 13
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '013';

-- INTERFONES: UUID → 14
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '014';

-- SERVICOS: UUID → 15
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '015';

-- NOBREAK: UUID → 16
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '016';

-- RACK: UUID → 17
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '017';

-- ELETRICA: id=8 → 18
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '018';

-- ELETROIMA: id=9 → 19
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '019';

-- INCÊNDIO: UUID → 20
UPDATE tipos_produtos 
SET id = CAST(codigo AS UNSIGNED)
WHERE codigo = '020';

-- ---------------------------------------------------------------
-- PASSO 4: Verificar resultado ANTES de confirmar
-- ---------------------------------------------------------------
SELECT 
    id,
    codigo,
    nome,
    ativo,
    CASE 
        WHEN id REGEXP '^[0-9]+$' THEN 'INTEGER ✓'
        ELSE 'PROBLEMA!'
    END AS tipo_id,
    CASE 
        WHEN CAST(id AS UNSIGNED) = CAST(codigo AS UNSIGNED) THEN 'BATE ✓'
        ELSE 'DIVERGE!'
    END AS id_bate_codigo
FROM tipos_produtos
ORDER BY CAST(codigo AS UNSIGNED);

-- ---------------------------------------------------------------
-- PASSO 5: Se o resultado acima estiver correto (todos INTEGER ✓
--          e BATE ✓), execute o COMMIT abaixo.
--          Se houver problemas, execute ROLLBACK.
-- ---------------------------------------------------------------

-- ✅ Confirmar alterações (descomente quando verificar o resultado):
-- COMMIT;

-- ❌ Desfazer alterações (execute se algo estiver errado):
-- ROLLBACK;

-- ---------------------------------------------------------------
-- PASSO 6: Reativar FKs (execute após COMMIT ou ROLLBACK)
-- ---------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------
-- PASSO 7 (OPCIONAL): Se quiser alterar o tipo da coluna para INT
--          após a normalização, execute:
-- ---------------------------------------------------------------
-- ALTER TABLE tipos_produtos MODIFY COLUMN id INT NOT NULL;
-- ALTER TABLE tipos_produtos AUTO_INCREMENT = 21;

-- ---------------------------------------------------------------
-- VERIFICAÇÃO FINAL
-- ---------------------------------------------------------------
-- SELECT id, codigo, nome FROM tipos_produtos ORDER BY CAST(id AS UNSIGNED);
