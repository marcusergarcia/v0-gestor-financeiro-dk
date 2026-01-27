import { NextResponse } from "next/server"
import { getAsaasAPI } from "@/lib/asaas"

export async function GET() {
  try {
    const apiKey = process.env.ASAAS_API_KEY
    const environment = process.env.ASAAS_ENVIRONMENT || "production"
    
    console.log("[Asaas Test] API Key exists:", !!apiKey)
    console.log("[Asaas Test] API Key length:", apiKey?.length || 0)
    console.log("[Asaas Test] Environment:", environment)
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "ASAAS_API_KEY não configurada",
        environment,
      })
    }
    
    // Tentar inicializar a API
    const asaas = getAsaasAPI()
    
    // Fazer uma requisição simples para listar clientes (limite 1)
    console.log("[Asaas Test] Tentando listar clientes...")
    
    const baseURL = environment === "sandbox" 
      ? "https://sandbox.asaas.com/api/v3" 
      : "https://api.asaas.com/v3"
    
    const response = await fetch(`${baseURL}/customers?limit=1`, {
      method: "GET",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json",
      },
    })
    
    const contentType = response.headers.get("content-type") || ""
    const responseText = await response.text()
    
    console.log("[Asaas Test] Status:", response.status)
    console.log("[Asaas Test] Content-Type:", contentType)
    console.log("[Asaas Test] Response:", responseText.substring(0, 500))
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Erro ao conectar com Asaas: ${response.status}`,
        environment,
        baseURL,
        status: response.status,
        contentType,
        response: responseText.substring(0, 500),
        apiKeyPreview: `${apiKey.substring(0, 10)}...`,
      })
    }
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: "Resposta não é JSON válido",
        environment,
        baseURL,
        response: responseText.substring(0, 500),
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Conexão com Asaas OK!",
      environment,
      baseURL,
      totalClientes: data.totalCount || 0,
      hasData: data.data?.length > 0,
    })
    
  } catch (error: any) {
    console.error("[Asaas Test] Erro:", error)
    return NextResponse.json({
      success: false,
      message: error.message,
      stack: error.stack?.substring(0, 500),
    })
  }
}
