import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const dia = String(hoje.getDate()).padStart(2, "0")

    const prefixoData = `${ano}${mes}${dia}`

    // Buscar o último código do dia
    const ultimoCodigo = await query("SELECT codigo FROM documentos WHERE codigo LIKE ? ORDER BY codigo DESC LIMIT 1", [
      `${prefixoData}%`,
    ])

    let proximoNumero = 1

    if ((ultimoCodigo as any[]).length > 0) {
      const codigo = (ultimoCodigo as any[])[0].codigo
      const numeroAtual = Number.parseInt(codigo.slice(-3)) // Pega os últimos 3 dígitos
      proximoNumero = numeroAtual + 1
    }

    const numeroFormatado = String(proximoNumero).padStart(3, "0")
    const proximoCodigo = `${prefixoData}${numeroFormatado}`

    return NextResponse.json({
      success: true,
      codigo: proximoCodigo,
    })
  } catch (error) {
    console.error("Erro ao gerar próximo código:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao gerar próximo código",
      },
      { status: 500 },
    )
  }
}
