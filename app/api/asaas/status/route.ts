import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.ASAAS_API_KEY
    const environment = process.env.ASAAS_ENVIRONMENT || "production"

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          environment,
          message: "ASAAS_API_KEY nao configurada"
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        environment,
        message: "Configurado"
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Erro ao verificar status do Asaas"
    }, { status: 500 })
  }
}
