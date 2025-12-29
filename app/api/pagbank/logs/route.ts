import { NextResponse } from "next/server"
import { PagBankLogger } from "@/lib/pagbank-logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"

    if (format === "txt") {
      const formattedLogs = await PagBankLogger.getFormattedLogs()

      return new NextResponse(formattedLogs, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="pagbank-logs-${new Date().toISOString().split("T")[0]}.txt"`,
        },
      })
    }

    const logs = await PagBankLogger.getLogs()
    return NextResponse.json({
      success: true,
      total: logs.length,
      logs,
    })
  } catch (error) {
    console.error("[PagBank Logs] Erro ao buscar logs:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar logs",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    await PagBankLogger.clearLogs()
    return NextResponse.json({
      success: true,
      message: "Logs limpos com sucesso",
    })
  } catch (error) {
    console.error("[PagBank Logs] Erro ao limpar logs:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao limpar logs",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
