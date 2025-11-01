import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await query(
      `
      SELECT 
        id,
        ordem_servico_id,
        tipo_assinatura as tipo,
        assinatura_base64 as caminho,
        nome_assinante as nome,
        data_assinatura
      FROM ordens_servico_assinaturas
      WHERE ordem_servico_id = ?
      ORDER BY data_assinatura
    `,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const result = await query(
      `
      INSERT INTO ordens_servico_assinaturas 
      (ordem_servico_id, tipo_assinatura, assinatura_base64, nome_assinante, data_assinatura)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      [id, data.tipo_assinatura, data.assinatura_base64, data.nome_assinante],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: (result as any).insertId,
        ...data,
      },
    })
  } catch (error) {
    console.error("Erro ao salvar assinatura:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
