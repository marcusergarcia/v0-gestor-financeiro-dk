import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const connection = await getConnection()

  try {
    const { id: boletoId } = await params
    
    // Tentar obter dados do body (data de pagamento e valor pago opcionais)
    let dataPagamento: string | null = null
    let valorPago: number | null = null
    
    try {
      const body = await request.json()
      dataPagamento = body.data_pagamento || null
      valorPago = body.valor_pago || null
    } catch {
      // Body vazio ou inválido, usar valores padrão
    }

    const [boletos] = await connection.execute("SELECT * FROM boletos WHERE id = ?", [boletoId])

    if (!Array.isArray(boletos) || boletos.length === 0) {
      return NextResponse.json({ error: "Boleto não encontrado" }, { status: 404 })
    }

    const boleto = boletos[0] as any

    // Atualiza para pago com valor_pago se fornecido
    const updateQuery = valorPago 
      ? `UPDATE boletos 
         SET status = 'pago', 
             data_pagamento = ?,
             valor_pago = ?,
             updated_at = NOW()
         WHERE id = ?`
      : `UPDATE boletos 
         SET status = 'pago', 
             data_pagamento = ?,
             valor_pago = valor,
             updated_at = NOW()
         WHERE id = ?`
    
    const updateParams = valorPago 
      ? [dataPagamento || new Date().toISOString().split("T")[0], valorPago, boletoId]
      : [dataPagamento || new Date().toISOString().split("T")[0], boletoId]
    
    await connection.execute(updateQuery, updateParams)

    return NextResponse.json({
      success: true,
      message: "Boleto marcado como pago",
      data: {
        boleto_id: boletoId,
        numero_boleto: boleto.numero,
        status_anterior: boleto.status,
        status_novo: "pago",
        data_pagamento: dataPagamento || new Date().toISOString().split("T")[0],
        valor_pago: valorPago || boleto.valor,
      },
    })
  } catch (error: any) {
    console.error("Erro ao marcar boleto como pago:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    connection.release()
  }
}
