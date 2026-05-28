import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

interface ContratoConservacao {
  id: number
  cliente_id: number
  numero: string
  data_inicio: string
  data_fim?: string
  valor_mensal: number
  equipamentos_inclusos?: string
  observacoes?: string
  status: string
  created_at: string
  updated_at: string
  cliente_nome?: string
  equipamentos_inclusos_parsed?: any[]
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clienteId = id

    // Buscar contrato de conservação ativo do cliente
    const contratos = await query(
      `SELECT 
        cc.*,
        c.nome as cliente_nome
      FROM contratos_conservacao cc
      LEFT JOIN clientes c ON cc.cliente_id = c.id
      WHERE cc.cliente_id = ? AND cc.status = 'ativo'
      ORDER BY cc.created_at DESC
      LIMIT 1`,
      [clienteId],
    )

    if (!Array.isArray(contratos) || contratos.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Nenhum contrato de conservação ativo encontrado",
      })
    }

    const contrato = contratos[0] as ContratoConservacao

    // Parse dos equipamentos inclusos se existir
    if (contrato.equipamentos_inclusos) {
      try {
        contrato.equipamentos_inclusos_parsed = JSON.parse(contrato.equipamentos_inclusos)
      } catch (error) {
        contrato.equipamentos_inclusos_parsed = []
      }
    } else {
      contrato.equipamentos_inclusos_parsed = []
    }

    return NextResponse.json({
      success: true,
      data: contrato,
    })
  } catch (error) {
    console.error("Erro ao buscar contrato de conservação do cliente:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
