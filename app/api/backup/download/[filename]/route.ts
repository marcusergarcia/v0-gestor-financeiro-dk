import { type NextRequest, NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const { filename } = params

    // Verificar se o arquivo existe nos diretórios de backup
    let filepath: string
    let found = false

    // Tentar encontrar o arquivo nos diretórios de backup
    const backupDirs = ["database", "system"]

    for (const dir of backupDirs) {
      const testPath = join(process.cwd(), "backups", dir, filename)
      try {
        await stat(testPath)
        filepath = testPath
        found = true
        break
      } catch {
        // Arquivo não encontrado neste diretório
      }
    }

    if (!found) {
      return NextResponse.json({ success: false, message: "Arquivo de backup não encontrado" }, { status: 404 })
    }

    // Ler o arquivo
    const fileBuffer = await readFile(filepath!)
    const stats = await stat(filepath!)

    // Determinar o tipo de conteúdo
    const contentType = filename.endsWith(".sql")
      ? "application/sql"
      : filename.endsWith(".zip")
        ? "application/zip"
        : "application/octet-stream"

    // Retornar o arquivo para download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": stats.size.toString(),
      },
    })
  } catch (error) {
    console.error("Erro ao fazer download do backup:", error)
    return NextResponse.json({ success: false, message: "Erro ao fazer download do arquivo" }, { status: 500 })
  }
}
