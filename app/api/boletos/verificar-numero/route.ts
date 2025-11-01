import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numero = searchParams.get("numero")

    if (!numero) {
      return NextResponse.json({ error: "Número é obrigatório" }, { status: 400 })
    }

    // Verificar se existe boleto com este número
    const result = (await query("SELECT COUNT(*) as count FROM boletos WHERE numero = ?", [numero])) as any[]

    const existe = result[0].count > 0

    return NextResponse.json({ existe })
  } catch (error) {
    console.error("Erro ao verificar número:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
