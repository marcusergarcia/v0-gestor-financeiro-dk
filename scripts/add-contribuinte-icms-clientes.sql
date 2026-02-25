-- Adicionar campos de contribuinte ICMS na tabela clientes
-- contribuinte_icms: 0 = Nao contribuinte (padrao), 1 = Contribuinte ICMS, 2 = Contribuinte Isento
-- inscricao_estadual: numero da inscricao estadual (obrigatorio quando contribuinte_icms = 1)

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS contribuinte_icms TINYINT NOT NULL DEFAULT 0
    COMMENT '0=Nao contribuinte, 1=Contribuinte ICMS, 2=Contribuinte Isento',
  ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20) DEFAULT NULL
    COMMENT 'Inscricao Estadual - obrigatorio quando contribuinte_icms=1';

-- Por padrao, todos os clientes existentes ficam como Nao Contribuinte (0)
-- que corresponde ao indIEDest=9 na NF-e
