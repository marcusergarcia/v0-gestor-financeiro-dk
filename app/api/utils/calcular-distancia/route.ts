import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Função para calcular distância usando a fórmula de Haversine
function calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distancia = R * c

  return Math.round(distancia * 10) / 10 // Arredonda para 1 casa decimal
}

// Função para buscar coordenadas usando OpenCage Geocoding (gratuito até 2500 req/dia)
// ou fallback para estimativa baseada no CEP
async function buscarCoordenadasPorCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, "")
    
    // Primeiro, buscar o CEP no ViaCEP para obter endereço completo
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const viaCepData = await viaCepResponse.json()
    
    if (viaCepData.erro) {
      console.log("[v0] CEP não encontrado no ViaCEP")
      return null
    }
    
    console.log("[v0] Dados do ViaCEP:", JSON.stringify(viaCepData))
    
    // Tentar usar a API do OpenStreetMap Nominatim com estrutura
    const tentativas = [
      // Tentativa 1: Endereço completo
      `street=${encodeURIComponent(viaCepData.logradouro || "")}&city=${encodeURIComponent(viaCepData.localidade)}&state=${encodeURIComponent(viaCepData.uf)}&country=Brazil&postalcode=${cepLimpo}`,
      // Tentativa 2: Bairro e cidade
      `q=${encodeURIComponent(`${viaCepData.bairro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`)}`,
      // Tentativa 3: Só cidade
      `city=${encodeURIComponent(viaCepData.localidade)}&state=${encodeURIComponent(viaCepData.uf)}&country=Brazil`,
    ]
    
    for (let i = 0; i < tentativas.length; i++) {
      try {
        console.log("[v0] Tentativa", i + 1, "de geocoding")
        const url = `https://nominatim.openstreetmap.org/search?${tentativas[i]}&format=json&limit=1`
        
        const response = await fetch(url, {
          headers: {
            "User-Agent": "GestorFinanceiro/1.0 (gestor@financeiro.com.br)",
            "Accept": "application/json",
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            console.log("[v0] Geocoding encontrou:", data[0].display_name)
            return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            }
          }
        }
        
        // Esperar um pouco entre tentativas para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (e) {
        console.log("[v0] Erro na tentativa", i + 1, ":", e)
      }
    }
    
    // Fallback: Usar coordenadas aproximadas de bairros de São Paulo
    // Baseado nos 3 primeiros dígitos do CEP (faixa postal)
    const prefixoCep = cepLimpo.substring(0, 5)
    
    // Mapa de faixas de CEP para coordenadas aproximadas em São Paulo
    const coordenadasCepSP: Record<string, { lat: number; lng: number }> = {
      // Zona Leste
      "03911": { lat: -23.5619, lng: -46.4833 }, // Vila Rica
      "03900": { lat: -23.5600, lng: -46.4850 },
      "03585": { lat: -23.5700, lng: -46.4900 }, // Jardim Brasília
      "03580": { lat: -23.5710, lng: -46.4906 },
      "08000": { lat: -23.5200, lng: -46.4100 }, // São Miguel
      "08400": { lat: -23.4900, lng: -46.4000 }, // Guaianases
      // Zona Sul
      "04000": { lat: -23.5800, lng: -46.6500 },
      "04500": { lat: -23.6200, lng: -46.6600 },
      // Zona Norte
      "02000": { lat: -23.4900, lng: -46.6300 },
      "02500": { lat: -23.4600, lng: -46.6200 },
      // Zona Oeste
      "05000": { lat: -23.5300, lng: -46.7000 },
      "05500": { lat: -23.5500, lng: -46.7500 },
      // Centro
      "01000": { lat: -23.5489, lng: -46.6388 },
    }
    
    // Verificar se temos coordenadas para o prefixo exato
    if (coordenadasCepSP[prefixoCep]) {
      console.log("[v0] Usando coordenadas da faixa de CEP:", prefixoCep)
      return coordenadasCepSP[prefixoCep]
    }
    
    // Tentar com os primeiros 3 dígitos + "00"
    const prefixo3 = cepLimpo.substring(0, 3) + "00"
    if (coordenadasCepSP[prefixo3]) {
      console.log("[v0] Usando coordenadas da faixa de CEP (3 dígitos):", prefixo3)
      return coordenadasCepSP[prefixo3]
    }
    
    // Fallback final: coordenadas aproximadas baseadas no estado
    const coordenadasCapitais: Record<string, { lat: number; lng: number }> = {
      "AC": { lat: -9.97499, lng: -67.8243 },
      "AL": { lat: -9.66599, lng: -35.735 },
      "AP": { lat: 0.034934, lng: -51.0694 },
      "AM": { lat: -3.10194, lng: -60.025 },
      "BA": { lat: -12.9714, lng: -38.5014 },
      "CE": { lat: -3.71722, lng: -38.5433 },
      "DF": { lat: -15.7942, lng: -47.8822 },
      "ES": { lat: -20.3155, lng: -40.3128 },
      "GO": { lat: -16.6869, lng: -49.2648 },
      "MA": { lat: -2.52972, lng: -44.3028 },
      "MT": { lat: -15.596, lng: -56.0969 },
      "MS": { lat: -20.4697, lng: -54.6201 },
      "MG": { lat: -19.9167, lng: -43.9345 },
      "PA": { lat: -1.45583, lng: -48.5044 },
      "PB": { lat: -7.11509, lng: -34.8641 },
      "PR": { lat: -25.4284, lng: -49.2733 },
      "PE": { lat: -8.04756, lng: -34.877 },
      "PI": { lat: -5.08921, lng: -42.8016 },
      "RJ": { lat: -22.9068, lng: -43.1729 },
      "RN": { lat: -5.79448, lng: -35.211 },
      "RS": { lat: -30.0346, lng: -51.2177 },
      "RO": { lat: -8.76077, lng: -63.8999 },
      "RR": { lat: 2.81972, lng: -60.6733 },
      "SC": { lat: -27.5954, lng: -48.548 },
      "SP": { lat: -23.5505, lng: -46.6333 },
      "SE": { lat: -10.9472, lng: -37.0731 },
      "TO": { lat: -10.1689, lng: -48.3317 },
    }
    
    const uf = viaCepData.uf
    if (coordenadasCapitais[uf]) {
      console.log("[v0] Usando coordenadas da capital do estado:", uf)
      return coordenadasCapitais[uf]
    }
    
    return null
  } catch (error) {
    console.error("[v0] Erro ao buscar coordenadas:", error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { cepCliente } = await request.json()

    if (!cepCliente) {
      return NextResponse.json({ success: false, message: "CEP do cliente é obrigatório" }, { status: 400 })
    }

    // Buscar coordenadas da empresa do banco de dados (usando query do lib/db que já retorna rows diretamente)
    console.log("[v0] Buscando configurações da empresa...")
    const configRows = await query("SELECT empresa_latitude, empresa_longitude FROM timbrado_config WHERE ativo = 1 ORDER BY id DESC LIMIT 1") as any[]
    console.log("[v0] configRows resultado:", JSON.stringify(configRows))

    if (!Array.isArray(configRows) || configRows.length === 0) {
      console.log("[v0] ERRO: Nenhuma configuração encontrada")
      return NextResponse.json(
        {
          success: false,
          message: "Configurações da empresa não encontradas. Configure o endereço da empresa primeiro.",
        },
        { status: 404 },
      )
    }

    const config = configRows[0]
    console.log("[v0] config row:", JSON.stringify(config))
    console.log("[v0] empresa_latitude raw:", config.empresa_latitude, "tipo:", typeof config.empresa_latitude)
    console.log("[v0] empresa_longitude raw:", config.empresa_longitude, "tipo:", typeof config.empresa_longitude)
    
    const latEmpresa = config.empresa_latitude !== null ? Number(config.empresa_latitude) : null
    const lonEmpresa = config.empresa_longitude !== null ? Number(config.empresa_longitude) : null
    console.log("[v0] Após conversão - latEmpresa:", latEmpresa, "lonEmpresa:", lonEmpresa)

    if (latEmpresa === null || lonEmpresa === null || isNaN(latEmpresa) || isNaN(lonEmpresa)) {
      console.log("[v0] ERRO: Coordenadas inválidas ou nulas")
      return NextResponse.json(
        {
          success: false,
          message: "Coordenadas da empresa não cadastradas. Configure o endereço da empresa primeiro.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Coordenadas da empresa válidas:", { latEmpresa, lonEmpresa })

    // Buscar coordenadas do cliente pelo CEP
    console.log("[v0] Buscando coordenadas do cliente pelo CEP:", cepCliente)
    const coordenadasCliente = await buscarCoordenadasPorCep(cepCliente)
    console.log("[v0] Coordenadas do cliente:", JSON.stringify(coordenadasCliente))

    if (!coordenadasCliente) {
      console.log("[v0] ERRO: Não foi possível obter coordenadas do cliente")
      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível obter as coordenadas do endereço do cliente",
        },
        { status: 404 },
      )
    }

    console.log("[v0] Coordenadas do cliente válidas:", coordenadasCliente)

    // Calcular distância
    const distanciaKm = calcularDistanciaHaversine(
      latEmpresa,
      lonEmpresa,
      coordenadasCliente.lat,
      coordenadasCliente.lng,
    )

    console.log("[v0] Distância calculada:", distanciaKm, "km")

    return NextResponse.json({
      success: true,
      data: {
        distanciaKm,
        coordenadasEmpresa: {
          latitude: latEmpresa,
          longitude: lonEmpresa,
        },
        coordenadasCliente: {
          latitude: coordenadasCliente.lat,
          longitude: coordenadasCliente.lng,
        },
      },
    })
  } catch (error) {
    console.error("Erro ao calcular distância:", error)
    return NextResponse.json({ success: false, message: "Erro ao calcular distância" }, { status: 500 })
  }
}
