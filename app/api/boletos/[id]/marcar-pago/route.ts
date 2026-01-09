import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const connection = await getConnection()

  try {
    const boletoId = params.id

    // Busca o boleto
    const [boletos] = await connection.execute("SELECT * FROM boletos WHERE id = ?", [boletoId])

    if (!Array.isArray(boletos) || boletos.length === 0) {
      return NextResponse.json({ error: "Boleto não encontrado" }, { status: 404 })
    }

    const boleto = boletos[0] as any

    // Atualiza para pago
    await connection.execute(
      `UPDATE boletos 
       SET status = 'pago', 
           data_pagamento = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [boletoId],
    )

    console.log(`[v0] Boleto ${boletoId} marcado como PAGO manualmente (TESTE)`)

    return NextResponse.json({
      success: true,
      message: "Boleto marcado como pago (TESTE)",
      boleto_id: boletoId,
      numero_boleto: boleto.numero_boleto,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao marcar boleto como pago:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await connection.end()
  }
}
