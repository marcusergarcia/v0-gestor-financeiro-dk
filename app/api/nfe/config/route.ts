import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute("SELECT * FROM nfe_config WHERE ativo = 1 LIMIT 1")
    const configs = rows as any[]

    if (configs.length === 0) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data: configs[0] })
  } catch (error: any) {
    console.error("Erro ao buscar config NF-e:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razao_social, nome_fantasia, cnpj, inscricao_estadual,
      endereco, numero_endereco, complemento, bairro, cidade, uf, cep,
      codigo_municipio, telefone, crt, serie_nfe, proximo_numero_nfe,
      ambiente, info_complementar, natureza_operacao,
      certificado_base64, certificado_senha, certificado_validade,
    } = body

    // Verificar se ja existe config
    const [existing] = await pool.execute("SELECT id FROM nfe_config WHERE ativo = 1 LIMIT 1")
    const existingConfigs = existing as any[]

    if (existingConfigs.length > 0) {
      // Update - build dynamic SET clause to only update cert fields when provided
      const setClauses = [
        "razao_social = ?", "nome_fantasia = ?", "cnpj = ?", "inscricao_estadual = ?",
        "endereco = ?", "numero_endereco = ?", "complemento = ?", "bairro = ?",
        "cidade = ?", "uf = ?", "cep = ?", "codigo_municipio = ?", "telefone = ?",
        "crt = ?", "serie_nfe = ?", "proximo_numero_nfe = ?", "ambiente = ?",
        "info_complementar = ?", "natureza_operacao = ?",
      ]
      const setValues: any[] = [
        razao_social, nome_fantasia || null, (cnpj || "").replace(/\D/g, ""),
        (inscricao_estadual || "").replace(/\D/g, ""),
        endereco || null, numero_endereco || null, complemento || null,
        bairro || null, cidade || "Sao Paulo", uf || "SP",
        (cep || "").replace(/\D/g, "") || null, codigo_municipio || "3550308",
        telefone || null, crt || 1, serie_nfe || 1,
        proximo_numero_nfe || existingConfigs[0].proximo_numero_nfe || 1,
        ambiente || 2, info_complementar || null, natureza_operacao || "Venda",
      ]

      // Only update certificate fields when they are provided
      if (certificado_base64) {
        setClauses.push("certificado_base64 = ?")
        setValues.push(certificado_base64)
      }
      if (certificado_senha !== undefined && certificado_senha !== "") {
        setClauses.push("certificado_senha = ?")
        setValues.push(certificado_senha)
      }
      if (certificado_validade) {
        setClauses.push("certificado_validade = ?")
        setValues.push(certificado_validade)
      }

      setValues.push(existingConfigs[0].id)

      await pool.execute(
        `UPDATE nfe_config SET ${setClauses.join(", ")} WHERE id = ?`,
        setValues
      )
    } else {
      // Insert
      await pool.execute(
        `INSERT INTO nfe_config (
          razao_social, nome_fantasia, cnpj, inscricao_estadual,
          endereco, numero_endereco, complemento, bairro,
          cidade, uf, cep, codigo_municipio, telefone,
          crt, serie_nfe, proximo_numero_nfe, ambiente,
          info_complementar, natureza_operacao,
          certificado_base64, certificado_senha, certificado_validade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          razao_social, nome_fantasia || null, (cnpj || "").replace(/\D/g, ""),
          (inscricao_estadual || "").replace(/\D/g, ""),
          endereco || null, numero_endereco || null, complemento || null,
          bairro || null, cidade || "Sao Paulo", uf || "SP",
          (cep || "").replace(/\D/g, "") || null, codigo_municipio || "3550308",
          telefone || null, crt || 1, serie_nfe || 1,
          proximo_numero_nfe || 1, ambiente || 2,
          info_complementar || null, natureza_operacao || "Venda",
          certificado_base64 || null, certificado_senha || null, certificado_validade || null,
        ]
      )
    }

    return NextResponse.json({ success: true, message: "Configuracao NF-e salva com sucesso!" })
  } catch (error: any) {
    console.error("Erro ao salvar config NF-e:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
