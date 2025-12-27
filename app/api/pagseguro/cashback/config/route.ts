import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

// Obter configuração de cashback
export async function GET() {
  try {
    const [configs] = await pool.execute(`SELECT * FROM cashback_config LIMIT 1`)

    if (Array.isArray(configs) && configs.length > 0) {
      return NextResponse.json({ success: true, data: configs[0] })
    }

    return NextResponse.json({
      success: true,
      data: { percentual_padrao: 2.0, ativo: true, valor_minimo_compra: 0.0 },
    })
  } catch (error) {
    console.error("[Cashback Config] Erro ao consultar:", error)
    return NextResponse.json({ success: false, message: "Erro ao consultar configuração" }, { status: 500 })
  }
}

// Atualizar configuração de cashback
export async function PUT(request: NextRequest) {
  try {
    const { percentualPadrao, ativo, valorMinimoCompra } = await request.json()

    if (percentualPadrao === undefined) {
      return NextResponse.json({ success: false, message: "Percentual padrão é obrigatório" }, { status: 400 })
    }

    // Atualizar no banco
    await pool.execute(
      `
      UPDATE cashback_config
      SET 
        percentual_padrao = ?,
        ativo = ?,
        valor_minimo_compra = ?
      WHERE id = 1
    `,
      [percentualPadrao, ativo !== undefined ? ativo : true, valorMinimoCompra || 0],
    )

    // Atualizar no ClubePag do PagSeguro
    try {
      const { getPagSeguroAPI } = await import("@/lib/pagseguro")
      const pagseguro = getPagSeguroAPI()
      await pagseguro.configurarCashback(percentualPadrao)
    } catch (error) {
      console.error("[Cashback Config] Erro ao atualizar no ClubePag:", error)
      // Continua mesmo se falhar no PagSeguro
    }

    return NextResponse.json({ success: true, message: "Configuração atualizada com sucesso" })
  } catch (error) {
    console.error("[Cashback Config] Erro ao atualizar:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar configuração" }, { status: 500 })
  }
}
