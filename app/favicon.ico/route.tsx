import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Buscar o favicon ativo no banco de dados
    const [rows] = await pool.execute(`
      SELECT dados, formato
      FROM logos_sistema 
      WHERE tipo = 'favicon' AND ativo = 1
      ORDER BY created_at DESC
      LIMIT 1
    `)

    const favicon = (rows as any[])[0]

    if (favicon && favicon.dados) {
      // Extrair os dados base64
      let base64Data = favicon.dados

      // Se os dados já têm o prefixo data:, remover
      if (base64Data.startsWith("data:")) {
        const matches = base64Data.match(/data:image\/[^;]+;base64,(.*)/)
        if (matches) {
          base64Data = matches[1]
        }
      }

      // Converter base64 para Buffer
      const buffer = Buffer.from(base64Data, "base64")

      // Determinar o Content-Type correto
      const contentType =
        favicon.formato === "ico" || favicon.formato === "x-icon"
          ? "image/x-icon"
          : favicon.formato === "png"
            ? "image/png"
            : favicon.formato === "jpg" || favicon.formato === "jpeg"
              ? "image/jpeg"
              : "image/x-icon"

      // Retornar o favicon com headers corretos
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400", // Cache por 1 dia
        },
      })
    }

    // Se não encontrar favicon, retornar um favicon SVG padrão
    const defaultFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#2563eb"/>
      <text x="50" y="70" font-size="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">GF</text>
    </svg>`

    return new NextResponse(defaultFavicon, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Erro ao buscar favicon:", error)

    // Retornar favicon padrão em caso de erro
    const defaultFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#2563eb"/>
      <text x="50" y="70" font-size="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">GF</text>
    </svg>`

    return new NextResponse(defaultFavicon, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    })
  }
}
