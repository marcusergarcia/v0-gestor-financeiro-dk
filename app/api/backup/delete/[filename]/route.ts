import { type NextRequest, NextResponse } from "next/server"
import { unlink, stat } from "fs/promises"
import { join } from "path"

export async function DELETE(request: NextRequest, { params }: { params: { filename: string } }) {
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

    // Excluir o arquivo
    await unlink(filepath!)

    return NextResponse.json({
      success: true,
      message: "Arquivo de backup excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir backup:", error)
    return NextResponse.json({ success: false, message: "Erro ao excluir arquivo de backup" }, { status: 500 })
  }
}
