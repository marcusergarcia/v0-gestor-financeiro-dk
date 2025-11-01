import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const documento = await query(
      `
      SELECT 
        d.*,
        c.nome as cliente_nome_completo,
        c.endereco as cliente_endereco_completo,
        c.telefone as cliente_telefone_completo,
        c.email as cliente_email_completo
      FROM documentos d
      LEFT JOIN clientes c ON d.cliente_id = c.id
      WHERE d.id = ?
    `,
      [id],
    )

    if ((documento as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Documento não encontrado",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: (documento as any[])[0],
    })
  } catch (error) {
    console.error("Erro ao buscar documento:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar documento",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { titulo, conteudo, cliente_id, tipo_documento, status, tags, observacoes } = body

    // Verificar se o documento existe
    const documentoExistente = await query("SELECT * FROM documentos WHERE id = ?", [id])

    if ((documentoExistente as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Documento não encontrado",
        },
        { status: 404 },
      )
    }

    // Buscar dados do cliente se fornecido
    let cliente_nome = null
    let cliente_endereco = null
    let cliente_telefone = null
    let cliente_email = null

    if (cliente_id) {
      const clienteResult = await query("SELECT nome, endereco, telefone, email FROM clientes WHERE id = ?", [
        cliente_id,
      ])
      const cliente = (clienteResult as any[])[0]

      if (cliente) {
        cliente_nome = cliente.nome
        cliente_endereco = cliente.endereco
        cliente_telefone = cliente.telefone
        cliente_email = cliente.email
      }
    }

    // Incrementar versão
    const versaoAtual = (documentoExistente as any[])[0].versao || 1
    const novaVersao = versaoAtual + 1

    // Atualizar documento
    await query(
      `
      UPDATE documentos SET
        titulo = ?, conteudo = ?, cliente_id = ?, cliente_nome = ?,
        cliente_endereco = ?, cliente_telefone = ?, cliente_email = ?,
        tipo_documento = ?, status = ?, tags = ?, versao = ?, observacoes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        titulo,
        conteudo,
        cliente_id,
        cliente_nome,
        cliente_endereco,
        cliente_telefone,
        cliente_email,
        tipo_documento,
        status,
        tags,
        novaVersao,
        observacoes,
        id,
      ],
    )

    // Buscar documento atualizado
    const documentoAtualizado = await query("SELECT * FROM documentos WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      data: (documentoAtualizado as any[])[0],
      message: "Documento atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar documento:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao atualizar documento",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar se o documento existe
    const documento = await query("SELECT * FROM documentos WHERE id = ?", [id])

    if ((documento as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Documento não encontrado",
        },
        { status: 404 },
      )
    }

    // Excluir documento
    await query("DELETE FROM documentos WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Documento excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir documento:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao excluir documento",
      },
      { status: 500 },
    )
  }
}
