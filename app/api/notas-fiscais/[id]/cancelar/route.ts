import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAsaasAPI } from "@/lib/asaas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const notas = await query(
      `SELECT id, asaas_id, status FROM notas_fiscais WHERE id = ?`,
      [id]
    )

    if ((notas as any[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "Nota fiscal nao encontrada" },
        { status: 404 }
      )
    }

    const nota = (notas as any[])[0]

    if (!nota.asaas_id) {
      // Se nao tem asaas_id, apenas marca como cancelada localmente
      await query(
        `UPDATE notas_fiscais SET status = 'cancelada', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      )
      return NextResponse.json({
        success: true,
        message: "Nota fiscal cancelada localmente",
      })
    }

    const asaas = getAsaasAPI()

    try {
      await asaas.cancelarNotaFiscal(nota.asaas_id)
    } catch (cancelError: any) {
      return NextResponse.json(
        { success: false, message: `Erro ao cancelar NFS-e no Asaas: ${cancelError.message}` },
        { status: 500 }
      )
    }

    await query(
      `UPDATE notas_fiscais SET status = 'processando_cancelamento', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    )

    return NextResponse.json({
      success: true,
      message: "Cancelamento da NFS-e solicitado ao Asaas",
    })
  } catch (error) {
    console.error("Erro ao cancelar NFS-e:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao cancelar NFS-e" },
      { status: 500 }
    )
  }
}
