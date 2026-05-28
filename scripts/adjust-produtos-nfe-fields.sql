-- Ajustar tamanhos dos campos da tabela produtos para compatibilidade com NF-e XSD
-- XSD limites: cProd(60), xProd(120), NCM(8), uCom(6)
-- Manter tamanhos maiores no DB mas adicionar comentarios de referencia

-- NCM deve ter exatamente 8 digitos no XSD, ajustar tamanho maximo
ALTER TABLE produtos MODIFY COLUMN ncm VARCHAR(8) DEFAULT NULL;

-- Unidade: XSD permite max 6 chars (ex: UN, CX, PC, KG, MT)
ALTER TABLE produtos MODIFY COLUMN unidade VARCHAR(6) DEFAULT 'UN';

-- Descricao: manter 500 no DB (usuario pode armazenar texto longo)
-- O xml-builder trunca para 120 chars ao gerar XML da NF-e

-- Codigo: manter 60 chars max (alinhado com XSD cProd max 60)
ALTER TABLE produtos MODIFY COLUMN codigo VARCHAR(60) NOT NULL;
