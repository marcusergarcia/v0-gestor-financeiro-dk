import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    const backupDir = join(process.cwd(), "backups")
    const backupFiles: any[] = []

    // Verificar diretórios de backup
    const backupTypes = ["database", "system"]

    for (const type of backupTypes) {
      const typeDir = join(backupDir, type)
      try {
        const files = await readdir(typeDir)

        for (const file of files) {
          const filePath = join(typeDir, file)
          const stats = await stat(filePath)

          backupFiles.push({
            filename: file,
            type,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            path: filePath,
          })
        }
      } catch (error) {
        // Diretório não existe ou erro de acesso
        console.log(`Diretório ${type} não encontrado ou inacessível`)
      }
    }

    // Ordenar por data de criação (mais recente primeiro)
    backupFiles.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json({
      success: true,
      backups: backupFiles,
    })
  } catch (error) {
    console.error("Erro ao listar backups:", error)
    return NextResponse.json({ success: false, message: "Erro ao listar arquivos de backup" }, { status: 500 })
  }
}
