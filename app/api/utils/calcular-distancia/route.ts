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

// Função para buscar coordenadas via BrasilAPI (usa o código IBGE para obter coordenadas do município)
async function buscarCoordenadasPorCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, "")
    
    // Primeiro, buscar o CEP no ViaCEP para obter o código IBGE
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const viaCepData = await viaCepResponse.json()
    
    if (viaCepData.erro) {
      console.log("[v0] CEP não encontrado no ViaCEP")
      return null
    }
    
    const ibge = viaCepData.ibge
    console.log("[v0] Código IBGE do município:", ibge)
    
    // Buscar coordenadas do município via IBGE API
    const ibgeResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${ibge}`)
    
    if (!ibgeResponse.ok) {
      console.log("[v0] Erro ao buscar município no IBGE:", ibgeResponse.status)
      return null
    }
    
    // A API do IBGE não retorna coordenadas diretamente, então vamos usar uma abordagem alternativa
    // Usar a API de localidades do IBGE com malha para obter o centroide
    const malhaResponse = await fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${ibge}?formato=application/vnd.geo+json`)
    
    if (malhaResponse.ok) {
      const malhaData = await malhaResponse.json()
      if (malhaData.features && malhaData.features.length > 0) {
        const geometry = malhaData.features[0].geometry
        // Calcular centroide aproximado do polígono
        if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
          const coords = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0][0]
          let sumLat = 0, sumLng = 0
          for (const coord of coords) {
            sumLng += coord[0]
            sumLat += coord[1]
          }
          return {
            lat: sumLat / coords.length,
            lng: sumLng / coords.length,
          }
        }
      }
    }
    
    // Fallback: usar coordenadas aproximadas baseadas no estado
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
