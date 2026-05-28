import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const fotos = await query(
      `SELECT 
        id,
        ordem_servico_id,
        nome_arquivo,
        caminho_arquivo,
        tipo_foto,
        descricao,
        created_at
      FROM ordens_servico_fotos 
      WHERE ordem_servico_id = ? 
      ORDER BY created_at DESC`,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: fotos,
    })
  } catch (error) {
    console.error("Erro ao buscar fotos:", error)
    return NextResponse.json({ success: false, error: "Erro ao buscar fotos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await request.formData()

    const file = formData.get("foto") as File
    const tipo_foto = formData.get("tipo_foto") as string
    const descricao = (formData.get("descricao") as string) || ""

    console.log("Dados recebidos:", {
      fileName: file?.name,
      fileType: file?.type,
      tipo_foto,
      descricao,
      ordemServicoId: id,
    })

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum arquivo foi enviado",
        },
        { status: 400 },
      )
    }

    if (!tipo_foto) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo da foto é obrigatório",
        },
        { status: 400 },
      )
    }

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Criar data URI com o tipo MIME correto
    const mimeType = file.type || "image/jpeg"
    const dataUri = `data:${mimeType};base64,${base64}`

    console.log("Salvando foto no banco de dados...")

    const result = await query(
      `INSERT INTO ordens_servico_fotos 
       (ordem_servico_id, nome_arquivo, caminho_arquivo, tipo_foto, descricao, created_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, file.name?.toUpperCase(), dataUri, tipo_foto, descricao?.toUpperCase()],
    )

    console.log("Foto salva com sucesso:", result.insertId)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertId,
        nome_arquivo: file.name,
        caminho_arquivo: dataUri,
        tipo_foto: tipo_foto,
        descricao: descricao,
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao fazer upload da foto",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
