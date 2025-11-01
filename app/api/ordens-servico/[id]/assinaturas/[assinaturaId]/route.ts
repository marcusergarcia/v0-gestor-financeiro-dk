import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assinaturaId: string }> },
) {
  try {
    const { assinaturaId } = await params

    await query("DELETE FROM ordens_servico_assinaturas WHERE id = ?", [assinaturaId])

    return NextResponse.json({
      success: true,
      message: "Assinatura deletada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar assinatura:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
