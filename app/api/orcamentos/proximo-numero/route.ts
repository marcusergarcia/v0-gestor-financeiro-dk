import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dataParam = searchParams.get("data") || new Date().toISOString().split("T")[0]

    // Extrair ano, mês e dia da data
    const [ano, mes, dia] = dataParam.split("-")

    // Buscar o próximo número sequencial para o dia específico
    const [sequencialRows] = await pool.execute(
      `
      SELECT COALESCE(MAX(CAST(RIGHT(numero, 3) AS UNSIGNED)), 0) + 1 as proximo
      FROM orcamentos
      WHERE numero LIKE ?
      `,
      [`${ano}${mes}${dia}%`],
    )

    const sequencial = (sequencialRows as any[])[0].proximo
    const sequencialFormatado = sequencial.toString().padStart(3, "0")

    // Formato: AAAAMMDDXXX (ano, mês, dia, sequencial)
    const numeroOrcamento = `${ano}${mes}${dia}${sequencialFormatado}`

    console.log(`Próximo número para ${dataParam}:`, {
      ano,
      mes,
      dia,
      sequencial,
      numeroFinal: numeroOrcamento,
    })

    return NextResponse.json({
      success: true,
      data: {
        numero: numeroOrcamento,
        sequencial,
        data: dataParam,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar próximo número:", error)
    return NextResponse.json({ success: false, message: "Erro ao gerar próximo número" }, { status: 500 })
  }
}
