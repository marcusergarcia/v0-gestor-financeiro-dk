import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("Buscando itens da ordem de serviço ID:", id)

    const result = await query(
      `
      SELECT 
        osi.id,
        osi.equipamento_id,
        osi.equipamento_nome,
        osi.quantidade,
        osi.observacoes,
        osi.situacao,
        osi.created_at,
        osi.updated_at,
        e.nome as equipamento_nome_atual,
        e.categoria,
        e.valor_hora,
        e.ativo
      FROM ordens_servico_itens osi
      LEFT JOIN equipamentos e ON osi.equipamento_id = e.id
      WHERE osi.ordem_servico_id = ?
      ORDER BY osi.created_at
    `,
      [id],
    )

    console.log("Itens encontrados:", result)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro ao buscar itens:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    console.log("Adicionando item à ordem de serviço ID:", id)
    console.log("Dados do item:", data)

    const result = await query(
      `INSERT INTO ordens_servico_itens 
      (ordem_servico_id, equipamento_id, equipamento_nome, quantidade, observacoes, situacao, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        id,
        data.equipamento_id,
        data.equipamento_nome?.toUpperCase(),
        data.quantidade || 1,
        data.observacoes?.toUpperCase() || null,
        data.situacao || "pendente",
      ],
    )

    console.log("Item inserido com ID:", (result as any).insertId)

    return NextResponse.json({
      success: true,
      data: {
        id: (result as any).insertId,
        ...data,
      },
    })
  } catch (error) {
    console.error("Erro ao adicionar item:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}
