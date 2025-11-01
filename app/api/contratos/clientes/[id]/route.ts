import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clienteId = id

    console.log(`[API] Buscando contratos de conservação do cliente ${clienteId}`)

    // Buscar contratos de conservação do cliente
    const contratos = await query(
      `SELECT 
        cc.*,
        cl.nome as cliente_nome
      FROM contratos_conservacao cc
      LEFT JOIN clientes cl ON cc.cliente_id = cl.id
      WHERE cc.cliente_id = ?
      ORDER BY cc.created_at DESC`,
      [clienteId],
    )

    console.log(`[API] Encontrados ${Array.isArray(contratos) ? contratos.length : 0} contratos`)

    return NextResponse.json({
      success: true,
      data: Array.isArray(contratos) ? contratos : [],
    })
  } catch (error) {
    console.error("Erro ao buscar contratos do cliente:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
