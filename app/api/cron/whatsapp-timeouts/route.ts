import { NextResponse } from "next/server"

// Este endpoint será chamado a cada minuto pelo Vercel Cron
// Configure em vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/whatsapp-timeouts",
//     "schedule": "* * * * *"
//   }]
// }

export async function GET(request: Request) {
  try {
    // Verificar se a requisição vem do Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] 🔄 Executando verificação de timeouts via cron...")

    // Chamar a API interna que verifica timeouts
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/check-timeouts`, {
      method: "GET",
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: "Verificação de timeouts executada",
      result,
    })
  } catch (error) {
    console.error("[v0] ❌ Erro ao executar cron de timeouts:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao executar verificação de timeouts",
      },
      { status: 500 },
    )
  }
}
