import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY || ""
  const environment = process.env.ASAAS_ENVIRONMENT || "production"
  
  const baseURL = environment === "sandbox" 
    ? "https://sandbox.asaas.com/api/v3" 
    : "https://api.asaas.com/v3"
  
  // Informações básicas sem fazer chamada externa
  const info = {
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + "..." : "N/A",
    environment,
    baseURL,
  }
  
  // Se não tem API key, retorna só as informações básicas
  if (!apiKey) {
    return NextResponse.json({
      ...info,
      error: "ASAAS_API_KEY não está configurada no Vercel",
      instructions: "Vá em Settings > Environment Variables no Vercel e adicione ASAAS_API_KEY",
    })
  }
  
  // Tenta fazer uma chamada simples para verificar a conexão
  try {
    const response = await fetch(`${baseURL}/customers?limit=1`, {
      method: "GET",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json",
      },
    })
    
    const responseText = await response.text()
    
    // Tentar parsear como JSON
    let responseJson = null
    try {
      responseJson = JSON.parse(responseText)
    } catch (e) {
      // Não é JSON
    }
    
    return NextResponse.json({
      ...info,
      apiResponse: {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        isJson: responseJson !== null,
        body: responseJson || responseText.substring(0, 300),
      },
      success: response.ok,
    })
    
  } catch (fetchError: any) {
    return NextResponse.json({
      ...info,
      fetchError: {
        message: fetchError.message,
        name: fetchError.name,
      },
      success: false,
    })
  }
}
