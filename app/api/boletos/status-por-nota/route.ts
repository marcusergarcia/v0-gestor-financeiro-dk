import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Buscar o status dos boletos agrupados por numero_nota
    // Retorna para cada numero_nota se tem boletos e se algum esta aguardando_pagamento
    const [rows] = await pool.execute(`
      SELECT 
        b.numero_nota,
        COUNT(*) as total_boletos,
        SUM(CASE WHEN b.status = 'aguardando_pagamento' THEN 1 ELSE 0 END) as aguardando_pagamento
      FROM boletos b
      WHERE b.numero_nota IS NOT NULL AND b.numero_nota != ''
      GROUP BY b.numero_nota
    `)

    const boletos = rows as any[]

    // Construir mapa: agrupar por numero base (sem -XX de parcelas)
    const statusMap: Record<string, { temBoleto: boolean; aguardandoPagamento: boolean }> = {}

    for (const row of boletos) {
      const numNota = String(row.numero_nota)
      // Extrair numero base (remover -01, -02, etc.)
      const numBase = numNota.replace(/-\d+$/, "")

      if (!statusMap[numBase]) {
        statusMap[numBase] = { temBoleto: false, aguardandoPagamento: false }
      }

      statusMap[numBase].temBoleto = true
      if (Number(row.aguardando_pagamento) > 0) {
        statusMap[numBase].aguardandoPagamento = true
      }
    }

    return NextResponse.json({ success: true, data: statusMap })
  } catch (error: any) {
    console.error("Erro ao buscar status boletos por nota:", error)
    return NextResponse.json(
      { success: false, message: error.message, data: {} },
      { status: 500 },
    )
  }
}
