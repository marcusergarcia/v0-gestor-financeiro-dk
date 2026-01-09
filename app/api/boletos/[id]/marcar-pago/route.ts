import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] API marcar-pago iniciada")
  console.log("[v0] Params recebidos:", params)
  console.log("[v0] Boleto ID:", params.id)

  const connection = await getConnection()

  try {
    const boletoId = params.id

    console.log("[v0] Buscando boleto no banco de dados...")
    // Busca o boleto
    const [boletos] = await connection.execute("SELECT * FROM boletos WHERE id = ?", [boletoId])

    console.log("[v0] Resultado da busca:", Array.isArray(boletos) ? `${boletos.length} registro(s)` : "não é array")

    if (!Array.isArray(boletos) || boletos.length === 0) {
      console.log("[v0] Boleto não encontrado no banco de dados")
      return NextResponse.json({ error: "Boleto não encontrado" }, { status: 404 })
    }

    const boleto = boletos[0] as any
    console.log("[v0] Boleto encontrado:", {
      id: boleto.id,
      numero: boleto.numero,
      status_atual: boleto.status,
    })

    console.log("[v0] Atualizando status para PAGO...")
    // Atualiza para pago
    const [result] = await connection.execute(
      `UPDATE boletos 
       SET status = 'pago', 
           data_pagamento = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [boletoId],
    )

    console.log("[v0] Resultado do UPDATE:", result)
    console.log("[v0] Boleto", boletoId, "marcado como PAGO manualmente (TESTE)")

    return NextResponse.json({
      success: true,
      message: "Boleto marcado como pago (TESTE)",
      data: {
        boleto_id: boletoId,
        numero_boleto: boleto.numero,
        status_anterior: boleto.status,
        status_novo: "pago",
      },
    })
  } catch (error: any) {
    console.error("[v0] ERRO ao marcar boleto como pago:", error)
    console.error("[v0] Stack trace:", error.stack)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    await connection.end()
  }
}
