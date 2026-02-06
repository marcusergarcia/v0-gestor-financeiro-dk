import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM nfse_config WHERE ativo = 1 ORDER BY created_at DESC LIMIT 1"
    )
    const configs = rows as any[]

    if (configs.length === 0) {
      return NextResponse.json({ success: true, data: null })
    }

    const config = configs[0]
    // Não enviar o certificado base64 completo no GET por segurança
    return NextResponse.json({
      success: true,
      data: {
        ...config,
        certificado_base64: config.certificado_base64 ? "[CARREGADO]" : null,
        certificado_senha: config.certificado_senha ? "***" : null,
      },
    })
  } catch (error: any) {
    console.error("Erro ao buscar config NFS-e:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao buscar configuracao: " + error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      inscricao_municipal,
      razao_social,
      cnpj,
      endereco,
      numero_endereco,
      complemento,
      bairro,
      cidade,
      uf,
      cep,
      codigo_municipio,
      codigo_servico,
      descricao_servico,
      aliquota_iss,
      codigo_cnae,
      regime_tributacao,
      optante_simples,
      incentivador_cultural,
      certificado_base64,
      certificado_senha,
      certificado_validade,
      ambiente,
      serie_rps,
      tipo_rps,
      proximo_numero_rps,
    } = body

    // Verificar se já existe config
    const [existing] = await pool.execute("SELECT id FROM nfse_config WHERE ativo = 1 LIMIT 1")

    if (Array.isArray(existing) && (existing as any[]).length > 0) {
      // Atualizar - só atualizar certificado se enviado novo
      const certUpdate = certificado_base64 && certificado_base64 !== "[CARREGADO]"
        ? ", certificado_base64 = ?, certificado_senha = ?, certificado_validade = ?"
        : ""

      const params = [
        inscricao_municipal,
        razao_social,
        cnpj?.replace(/\D/g, ""),
        endereco,
        numero_endereco,
        complemento,
        bairro,
        cidade || "SAO PAULO",
        uf || "SP",
        cep?.replace(/\D/g, ""),
        codigo_municipio || "3550308",
        codigo_servico,
        descricao_servico,
        aliquota_iss || 0.05,
        codigo_cnae,
        regime_tributacao || 1,
        optante_simples || 0,
        incentivador_cultural || 0,
        ambiente || 2,
        serie_rps || "11",
        tipo_rps || 1,
        proximo_numero_rps || 660,
      ]

      if (certUpdate) {
        params.push(certificado_base64, certificado_senha, certificado_validade)
      }

      await pool.execute(
        `UPDATE nfse_config SET 
          inscricao_municipal = ?, razao_social = ?, cnpj = ?,
          endereco = ?, numero_endereco = ?, complemento = ?,
          bairro = ?, cidade = ?, uf = ?, cep = ?,
          codigo_municipio = ?, codigo_servico = ?, descricao_servico = ?,
          aliquota_iss = ?, codigo_cnae = ?, regime_tributacao = ?,
          optante_simples = ?, incentivador_cultural = ?,
          ambiente = ?, serie_rps = ?, tipo_rps = ?,
          proximo_numero_rps = ?
          ${certUpdate},
          updated_at = CURRENT_TIMESTAMP
        WHERE ativo = 1`,
        params,
      )
    } else {
      // Inserir nova config
      await pool.execute(
        `INSERT INTO nfse_config (
          inscricao_municipal, razao_social, cnpj,
          endereco, numero_endereco, complemento,
          bairro, cidade, uf, cep,
          codigo_municipio, codigo_servico, descricao_servico,
          aliquota_iss, codigo_cnae, regime_tributacao,
          optante_simples, incentivador_cultural,
          certificado_base64, certificado_senha, certificado_validade,
          ambiente, serie_rps, tipo_rps, proximo_numero_rps, ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          inscricao_municipal,
          razao_social,
          cnpj?.replace(/\D/g, ""),
          endereco,
          numero_endereco,
          complemento,
          bairro,
          cidade || "SAO PAULO",
          uf || "SP",
          cep?.replace(/\D/g, ""),
          codigo_municipio || "3550308",
          codigo_servico,
          descricao_servico,
          aliquota_iss || 0.05,
          codigo_cnae,
          regime_tributacao || 1,
          optante_simples || 0,
          incentivador_cultural || 0,
          certificado_base64 || null,
          certificado_senha || null,
          certificado_validade || null,
          ambiente || 2,
          serie_rps || "11",
          tipo_rps || 1,
          proximo_numero_rps || 660,
        ],
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configuracao NFS-e salva com sucesso!",
    })
  } catch (error: any) {
    console.error("Erro ao salvar config NFS-e:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao salvar configuracao: " + error.message },
      { status: 500 },
    )
  }
}
