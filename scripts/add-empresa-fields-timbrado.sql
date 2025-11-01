-- Adicionar novos campos na tabela timbrado_config
ALTER TABLE timbrado_config 
ADD COLUMN IF NOT EXISTS empresa_cep VARCHAR(10) DEFAULT '',
ADD COLUMN IF NOT EXISTS empresa_bairro VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS empresa_cidade VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS empresa_uf VARCHAR(2) DEFAULT '',
ADD COLUMN IF NOT EXISTS empresa_representante_legal VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS representante_nacionalidade VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS representante_estado_civil VARCHAR(20) DEFAULT '',
ADD COLUMN IF NOT EXISTS representante_rg VARCHAR(20) DEFAULT '',
ADD COLUMN IF NOT EXISTS representante_cpf VARCHAR(14) DEFAULT '';
