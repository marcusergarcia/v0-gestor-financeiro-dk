import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; fotoId: string }> }) {
  try {
    const { id, fotoId } = await params

    console.log("Deletando foto:", { ordemServicoId: id, fotoId })

    // Verificar se a foto pertence à ordem de serviço
    const foto = await query("SELECT * FROM ordens_servico_fotos WHERE id = ? AND ordem_servico_id = ?", [fotoId, id])

    if (!foto || foto.length === 0) {
      return NextResponse.json({ success: false, error: "Foto não encontrada" }, { status: 404 })
    }

    // Deletar do banco de dados
    await query("DELETE FROM ordens_servico_fotos WHERE id = ? AND ordem_servico_id = ?", [fotoId, id])

    console.log("Foto deletada com sucesso")

    return NextResponse.json({
      success: true,
      message: "Foto deletada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar foto:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao deletar foto",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
