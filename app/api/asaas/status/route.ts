import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.ASAAS_API_KEY
    const environment = process.env.ASAAS_ENVIRONMENT || "production"
    
    // Informacoes basicas
    const info = {
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + "..." : null,
      environment,
      baseUrl: environment === "sandbox" 
        ? "https://sandbox.asaas.com/api/v3" 
        : "https://api.asaas.com/v3",
      timestamp: new Date().toISOString()
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "ASAAS_API_KEY nao configurada",
        info
      })
    }

    // Testar conexao real com a API do Asaas
    const baseUrl = environment === "sandbox" 
      ? "https://sandbox.asaas.com/api/v3" 
      : "https://api.asaas.com/v3"
    
    const testUrl = `${baseUrl}/customers?limit=1`
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json"
      }
    })
    
    const responseText = await response.text()
    let responseData = null
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      // Resposta nao e JSON
    }

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Conexao com Asaas OK",
        info,
        test: {
          status: response.status,
          totalClientes: responseData?.totalCount || 0
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Erro ao conectar com Asaas",
        info,
        test: {
          status: response.status,
          error: responseData?.errors || responseText.substring(0, 200)
        }
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Erro ao verificar status do Asaas",
      error: error.message
    }, { status: 500 })
  }
}
