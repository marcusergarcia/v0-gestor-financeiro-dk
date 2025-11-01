import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [result] = await pool.execute(`
      SELECT * FROM visitas_tecnicas_config 
      WHERE ativo = 1 
      ORDER BY quantidade_visitas ASC
    `)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro ao buscar configurações de visitas técnicas:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { configs } = await request.json()

    console.log("Dados recebidos:", { configs })

    if (!Array.isArray(configs)) {
      return NextResponse.json({ success: false, error: "Configurações devem ser um array" }, { status: 400 })
    }

    // Validar cada configuração
    for (const config of configs) {
      if (!config.quantidade_visitas || config.quantidade_visitas < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Quantidade de visitas deve ser maior que zero",
          },
          { status: 400 },
        )
      }

      if (config.percentual_desconto < 0 || config.percentual_desconto > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Percentual de desconto deve estar entre 0 e 100",
          },
          { status: 400 },
        )
      }
    }

    // Limpar todas as configurações existentes
    await pool.execute(`DELETE FROM visitas_tecnicas_config`)

    // Inserir todas as novas configurações
    for (const config of configs) {
      await pool.execute(
        `
        INSERT INTO visitas_tecnicas_config (quantidade_visitas, percentual_desconto, ativo, created_at, updated_at)
        VALUES (?, ?, 1, NOW(), NOW())
      `,
        [config.quantidade_visitas, config.percentual_desconto],
      )
    }

    console.log(`Inseridas ${configs.length} configurações`)

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar configurações de visitas técnicas:", error)

    // Verificar se é erro de duplicata
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error: "Já existe uma configuração para esta quantidade de visitas",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
