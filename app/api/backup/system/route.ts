import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { includeNodeModules, includeLogs, includeBackups } = await request.json()

    // Para o ambiente Vercel, vamos criar um backup simplificado
    // já que não temos acesso ao sistema de arquivos completo
    const backupInfo = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      nodeVersion: process.version,
      platform: process.platform,
      includeNodeModules,
      includeLogs,
      includeBackups,
      message: "Backup do sistema não disponível no ambiente Vercel. Use o backup do banco de dados.",
    }

    return NextResponse.json({
      success: true,
      message: "Informações do sistema coletadas. Para backup completo, use o backup do banco de dados.",
      data: backupInfo,
    })
  } catch (error) {
    console.error("Erro ao criar backup do sistema:", error)
    return NextResponse.json({ success: false, message: "Erro ao criar backup do sistema" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Informações básicas do sistema disponíveis no Vercel
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      systemInfo,
    })
  } catch (error) {
    console.error("Erro ao obter informações do sistema:", error)
    return NextResponse.json({ success: false, message: "Erro ao obter informações do sistema" }, { status: 500 })
  }
}
