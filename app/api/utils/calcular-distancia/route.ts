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

// Função auxiliar para fazer requisição ao Nominatim
async function buscarNoNominatim(searchQuery: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedQuery = encodeURIComponent(searchQuery)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=br`, {
      headers: {
        "User-Agent": "GestorFinanceiro/1.0 (contact@example.com)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    })

    const data = await response.json()

    if (data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error("Erro ao buscar no Nominatim:", error)
    return null
  }
}

// Função para buscar coordenadas via Nominatim (OpenStreetMap) com múltiplas tentativas
async function buscarCoordenadas(
  endereco: string,
  bairro: string,
  cidade: string,
  uf: string,
): Promise<{ lat: number; lng: number } | null> {
  // Estratégia 1: Endereço completo com bairro
  if (endereco) {
    const query1 = `${endereco}, ${bairro}, ${cidade}, ${uf}, Brasil`
    console.log("[v0] Tentativa 1 - Endereço completo:", query1)
    const result1 = await buscarNoNominatim(query1)
    if (result1) return result1
  }

  // Estratégia 2: Só bairro e cidade
  if (bairro) {
    const query2 = `${bairro}, ${cidade}, ${uf}, Brasil`
    console.log("[v0] Tentativa 2 - Bairro e cidade:", query2)
    const result2 = await buscarNoNominatim(query2)
    if (result2) return result2
  }

  // Estratégia 3: Só cidade e estado
  const query3 = `${cidade}, ${uf}, Brasil`
  console.log("[v0] Tentativa 3 - Cidade e estado:", query3)
  const result3 = await buscarNoNominatim(query3)
  if (result3) return result3

  return null
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

    // Buscar endereço do cliente via ViaCEP
    const cepLimpo = cepCliente.replace(/\D/g, "")
    console.log("[v0] Buscando CEP do cliente:", cepLimpo)
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const enderecoData = await viaCepResponse.json()
    console.log("[v0] Resposta ViaCEP:", JSON.stringify(enderecoData))

    if (enderecoData.erro) {
      console.log("[v0] ERRO: CEP não encontrado no ViaCEP")
      return NextResponse.json({ success: false, message: "CEP não encontrado" }, { status: 404 })
    }

    // Buscar coordenadas do cliente via Nominatim
    console.log("[v0] Buscando coordenadas para:", enderecoData.logradouro, enderecoData.bairro, enderecoData.localidade, enderecoData.uf)
    const coordenadasCliente = await buscarCoordenadas(
      enderecoData.logradouro || "",
      enderecoData.bairro || "",
      enderecoData.localidade,
      enderecoData.uf,
    )
    console.log("[v0] Resultado final Nominatim:", JSON.stringify(coordenadasCliente))

    if (!coordenadasCliente) {
      console.log("[v0] ERRO: Não foi possível obter coordenadas do cliente via Nominatim")
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
        endereco: enderecoData,
      },
    })
  } catch (error) {
    console.error("Erro ao calcular distância:", error)
    return NextResponse.json({ success: false, message: "Erro ao calcular distância" }, { status: 500 })
  }
}
