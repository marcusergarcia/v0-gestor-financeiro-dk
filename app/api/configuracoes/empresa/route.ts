import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute("SELECT * FROM timbrado_config WHERE ativo = 1 ORDER BY created_at DESC LIMIT 1")

    const configs = rows as any[]
    if (configs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          nome: "",
          cnpj: "",
          endereco: "",
          telefone: "",
          email: "",
          site: "",
        },
      })
    }

    const config = configs[0]
    return NextResponse.json({
      success: true,
      data: {
        nome: config.empresa_nome || "",
        cnpj: config.empresa_cnpj || "",
        endereco: config.empresa_endereco || "",
        telefone: config.empresa_telefone || "",
        email: config.empresa_email || "",
        site: config.empresa_site || "",
      },
    })
  } catch (error) {
    console.error("Erro ao buscar configurações da empresa:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar configurações da empresa",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, cnpj, endereco, telefone, email, site } = await request.json()

    // Verificar se já existe configuração
    const [existing] = await pool.execute("SELECT id FROM timbrado_config WHERE ativo = 1 LIMIT 1")

    if (Array.isArray(existing) && existing.length > 0) {
      // Atualizar configuração existente
      await pool.execute(
        `UPDATE timbrado_config 
         SET empresa_nome = ?, empresa_cnpj = ?, empresa_endereco = ?, 
             empresa_telefone = ?, empresa_email = ?, empresa_site = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE ativo = 1`,
        [nome, cnpj, endereco, telefone, email, site],
      )
    } else {
      // Criar nova configuração
      await pool.execute(
        `INSERT INTO timbrado_config 
         (empresa_nome, empresa_cnpj, empresa_endereco, empresa_telefone, 
          empresa_email, empresa_site, ativo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [nome, cnpj, endereco, telefone, email, site],
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configurações da empresa salvas com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao salvar configurações da empresa:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao salvar configurações da empresa",
      },
      { status: 500 },
    )
  }
}
