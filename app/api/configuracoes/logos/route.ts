import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, tipo, nome, dados, formato, tamanho, dimensoes, ativo, created_at
      FROM logos_sistema 
      WHERE ativo = 1
      ORDER BY tipo, created_at DESC
    `)

    // Processar os dados para garantir compatibilidade com navegadores
    const processedRows = (rows as any[]).map((row) => {
      if (row.dados && !row.dados.startsWith("data:")) {
        // Se os dados não têm o prefixo data:, adicionar
        const mimeType = getMimeType(row.formato || "png")
        row.dados = `data:${mimeType};base64,${row.dados}`
      }
      return row
    })

    return NextResponse.json({
      success: true,
      data: processedRows || [],
    })
  } catch (error) {
    console.error("Erro ao buscar logos:", error)
    return NextResponse.json({
      success: false,
      data: [],
      error: "Erro ao buscar logos",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Dados recebidos:", body)

    const { tipo, nome, dados, formato, tamanho, dimensoes } = body

    // Validar campos obrigatórios
    if (!tipo || !nome || !dados) {
      console.log("Dados faltando:", { tipo, nome, dados: dados ? "presente" : "ausente" })
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não informados (tipo, nome, dados)",
        },
        { status: 400 },
      )
    }

    // Processar dados da imagem
    let formatoFinal = formato || "png"
    let tamanhoFinal = tamanho || 0
    let dadosBase64 = dados
    const dimensoesFinal = dimensoes || "32x32"

    // Se os dados vêm com o prefixo data:, extrair apenas o base64
    if (dados.startsWith("data:")) {
      const matches = dados.match(/data:image\/([^;]+);base64,(.*)/)
      if (matches) {
        formatoFinal = matches[1].toLowerCase()
        dadosBase64 = matches[2]

        // Calcular tamanho se não foi fornecido
        if (!tamanho) {
          tamanhoFinal = Math.round((dadosBase64.length * 3) / 4)
        }
      }
    }

    // Validar formato de imagem
    const formatosPermitidos = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "x-icon", "vnd.microsoft.icon"]
    if (!formatosPermitidos.includes(formatoFinal)) {
      return NextResponse.json(
        {
          success: false,
          error: `Formato de imagem não suportado: ${formatoFinal}`,
        },
        { status: 400 },
      )
    }

    // Normalizar formato ico
    if (formatoFinal === "x-icon" || formatoFinal === "vnd.microsoft.icon") {
      formatoFinal = "ico"
    }

    console.log("Processando logo:", {
      tipo,
      formato: formatoFinal,
      tamanho: tamanhoFinal,
      dimensoes: dimensoesFinal,
    })

    // Desativar logo anterior do mesmo tipo
    await pool.execute(`UPDATE logos_sistema SET ativo = 0 WHERE tipo = ? AND ativo = 1`, [tipo])

    // Inserir novo logo
    const [result] = await pool.execute(
      `
      INSERT INTO logos_sistema (tipo, nome, dados, formato, tamanho, dimensoes, ativo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `,
      [tipo, nome, dadosBase64, formatoFinal, tamanhoFinal, dimensoesFinal],
    )

    const insertId = (result as any).insertId

    // Buscar o logo criado e retornar com prefixo data:
    const [newLogo] = await pool.execute(
      `
      SELECT id, tipo, nome, dados, formato, tamanho, dimensoes, ativo, created_at
      FROM logos_sistema WHERE id = ?
    `,
      [insertId],
    )

    const logoData = (newLogo as any[])[0]
    if (logoData && logoData.dados && !logoData.dados.startsWith("data:")) {
      const mimeType = getMimeType(logoData.formato)
      logoData.dados = `data:${mimeType};base64,${logoData.dados}`
    }

    return NextResponse.json({
      success: true,
      data: logoData,
      message: `Logo ${tipo} salvo com sucesso`,
    })
  } catch (error) {
    console.error("Erro ao salvar logo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao salvar logo",
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
