-- ============================================================
-- Adicionar coluna 'ordem' na tabela orcamentos_itens
-- para persistir a ordem do arrastar-soltar (drag-and-drop)
-- ============================================================

-- 1. Adicionar a coluna (IF NOT EXISTS protege contra execução dupla)
ALTER TABLE orcamentos_itens 
ADD COLUMN IF NOT EXISTS ordem INT NOT NULL DEFAULT 0;

-- 2. Inicializar a ordem dos registros existentes baseada no created_at
--    Garante que orçamentos já salvos mantenham uma ordem consistente
UPDATE orcamentos_itens oi
JOIN (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY orcamento_numero ORDER BY created_at ASC, id ASC) - 1 AS nova_ordem
  FROM orcamentos_itens
) ranked ON oi.id = ranked.id
SET oi.ordem = ranked.nova_ordem;

-- 3. Criar índice composto para performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_ordem 
ON orcamentos_itens (orcamento_numero, ordem);

-- Verificar resultado
SELECT 'Migracao concluida!' AS status;
DESCRIBE orcamentos_itens;
