import { type NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se o logo existe
    const existingLogo = await query(`SELECT id, tipo FROM logos_sistema WHERE id = ?`, [id])

    if (!Array.isArray(existingLogo) || existingLogo.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Logo não encontrado",
        },
        { status: 404 },
      )
    }

    // Excluir o logo
    await query(`DELETE FROM logos_sistema WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Logo excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir logo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao excluir logo",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { nome, ativo } = await request.json()

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID é obrigatório",
        },
        { status: 400 },
      )
    }

    const [result] = await execute(
      `
      UPDATE logos_sistema 
      SET nome = ?, ativo = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [nome, ativo, id],
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Logo não encontrado",
        },
        { status: 404 },
      )
    }

    // Buscar o logo atualizado
    const updatedLogo = await query(
      `
      SELECT id, tipo, nome, dados, formato, tamanho, dimensoes, ativo, created_at
      FROM logos_sistema WHERE id = ?
    `,
      [id],
    )

    const logoData = (updatedLogo as any[])[0]
    if (logoData && logoData.dados && !logoData.dados.startsWith("data:")) {
      const mimeType = getMimeType(logoData.formato)
      logoData.dados = `data:${mimeType};base64,${logoData.dados}`
    }

    return NextResponse.json({
      success: true,
      data: logoData,
      message: "Logo atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar logo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao atualizar logo",
      },
      { status: 500 },
    )
  }
}

// Função auxiliar para obter MIME type correto
function getMimeType(formato: string): string {
  const mimeTypes: { [key: string]: string } = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
  }

  return mimeTypes[formato.toLowerCase()] || "image/png"
}
