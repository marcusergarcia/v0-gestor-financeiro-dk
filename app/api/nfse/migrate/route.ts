import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST() {
  const connection = await pool.getConnection()
  try {
    // Create nfse_config table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS nfse_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscricao_municipal VARCHAR(20) NOT NULL,
        razao_social VARCHAR(255) NOT NULL,
        cnpj VARCHAR(14) NOT NULL,
        endereco VARCHAR(255),
        numero_endereco VARCHAR(20),
        complemento VARCHAR(100),
        bairro VARCHAR(100),
        cidade VARCHAR(100) DEFAULT 'SAO PAULO',
        uf VARCHAR(2) DEFAULT 'SP',
        cep VARCHAR(8),
        codigo_municipio VARCHAR(7) DEFAULT '3550308',
        codigo_servico VARCHAR(10) NOT NULL,
        descricao_servico TEXT,
        aliquota_iss DECIMAL(5,4) DEFAULT 0.0500,
        codigo_cnae VARCHAR(10),
        regime_tributacao TINYINT DEFAULT 1,
        optante_simples TINYINT(1) DEFAULT 0,
        incentivador_cultural TINYINT(1) DEFAULT 0,
        certificado_base64 LONGTEXT,
        certificado_senha VARCHAR(255),
        certificado_validade DATE,
        ambiente TINYINT DEFAULT 2,
        serie_rps VARCHAR(10) DEFAULT '11',
        tipo_rps TINYINT DEFAULT 1,
        proximo_numero_rps INT DEFAULT 860,
        ativo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // Create notas_fiscais table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notas_fiscais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_nfse VARCHAR(20),
        numero_rps INT NOT NULL,
        serie_rps VARCHAR(10) DEFAULT '11',
        tipo_rps TINYINT DEFAULT 1,
        codigo_verificacao VARCHAR(50),
        origem VARCHAR(30) NOT NULL,
        origem_id INT,
        origem_numero VARCHAR(50),
        prestador_cnpj VARCHAR(14) NOT NULL,
        prestador_inscricao_municipal VARCHAR(20) NOT NULL,
        cliente_id INT,
        tomador_tipo VARCHAR(2) NOT NULL,
        tomador_cpf_cnpj VARCHAR(14) NOT NULL,
        tomador_inscricao_municipal VARCHAR(20),
        tomador_razao_social VARCHAR(255) NOT NULL,
        tomador_email VARCHAR(255),
        tomador_telefone VARCHAR(20),
        tomador_endereco VARCHAR(255),
        tomador_numero VARCHAR(20),
        tomador_complemento VARCHAR(100),
        tomador_bairro VARCHAR(100),
        tomador_cidade VARCHAR(100),
        tomador_uf VARCHAR(2),
        tomador_cep VARCHAR(8),
        tomador_codigo_municipio VARCHAR(7),
        codigo_servico VARCHAR(10) NOT NULL,
        descricao_servico TEXT NOT NULL,
        codigo_cnae VARCHAR(10),
        valor_servicos DECIMAL(15,2) NOT NULL,
        valor_deducoes DECIMAL(15,2) DEFAULT 0.00,
        valor_pis DECIMAL(15,2) DEFAULT 0.00,
        valor_cofins DECIMAL(15,2) DEFAULT 0.00,
        valor_inss DECIMAL(15,2) DEFAULT 0.00,
        valor_ir DECIMAL(15,2) DEFAULT 0.00,
        valor_csll DECIMAL(15,2) DEFAULT 0.00,
        valor_iss DECIMAL(15,2) DEFAULT 0.00,
        aliquota_iss DECIMAL(5,4) DEFAULT 0.0500,
        iss_retido TINYINT(1) DEFAULT 0,
        valor_total DECIMAL(15,2) NOT NULL,
        status VARCHAR(30) DEFAULT 'pendente',
        data_emissao DATETIME,
        data_cancelamento DATETIME,
        motivo_cancelamento TEXT,
        xml_envio LONGTEXT,
        xml_retorno LONGTEXT,
        codigo_erro VARCHAR(20),
        mensagem_erro TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_numero_nfse (numero_nfse),
        INDEX idx_numero_rps (numero_rps),
        INDEX idx_status (status),
        INDEX idx_cliente_id (cliente_id),
        INDEX idx_origem (origem, origem_id),
        INDEX idx_data_emissao (data_emissao)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // Create nfse_transmissoes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS nfse_transmissoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nota_fiscal_id INT NOT NULL,
        tipo VARCHAR(30) NOT NULL,
        xml_envio LONGTEXT,
        xml_retorno LONGTEXT,
        sucesso TINYINT(1) DEFAULT 0,
        codigo_erro VARCHAR(20),
        mensagem_erro TEXT,
        tempo_resposta_ms INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nota_fiscal_id (nota_fiscal_id),
        FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    return NextResponse.json({
      success: true,
      message: "Tabelas NFS-e criadas com sucesso!",
    })
  } catch (error: any) {
    console.error("Erro ao criar tabelas NFS-e:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar tabelas: " + error.message,
      },
      { status: 500 },
    )
  } finally {
    connection.release()
  }
}
