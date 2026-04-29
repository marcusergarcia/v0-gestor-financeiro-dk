// API para calcular distância entre empresa e cliente usando coordenadas geográficas
import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

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

// Função para buscar coordenadas via BrasilAPI (tem dados de CEPs brasileiros com coordenadas)
async function buscarCoordenadasPorCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // BrasilAPI retorna coordenadas para alguns CEPs
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
      return {
        lat: data.location.coordinates.latitude,
        lng: data.location.coordinates.longitude,
      }
    }
    
    return null
  } catch (error) {
    console.error("Erro ao buscar coordenadas via BrasilAPI:", error)
    return null
  }
}

// Função para buscar coordenadas via Nominatim (OpenStreetMap) - fallback
async function buscarCoordenadasNominatim(
  endereco: string,
  bairro: string,
  cidade: string,
  uf: string,
): Promise<{ lat: number; lng: number } | null> {
  // Tentar múltiplas buscas do mais específico ao menos específico
  const tentativas = [
    `${endereco}, ${bairro}, ${cidade}, ${uf}, Brazil`,
    `${bairro}, ${cidade}, ${uf}, Brazil`,
    `${cidade}, ${uf}, Brazil`,
  ]

  for (const query of tentativas) {
    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=5&addressdetails=1`

      const response = await fetch(url, {
        headers: {
          "User-Agent": "GestorFinanceiro/1.0 (contato@empresa.com.br)",
          "Accept": "application/json",
        },
      })

      if (!response.ok) continue

      const data = await response.json()

      if (data.length > 0) {
        // Filtrar para garantir que está na cidade correta
        const resultado = data.find((item: any) => {
          const displayName = item.display_name?.toLowerCase() || ""
          return displayName.includes(cidade.toLowerCase())
        })

        if (resultado) {
          return {
            lat: Number.parseFloat(resultado.lat),
            lng: Number.parseFloat(resultado.lon),
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas via Nominatim:", error)
    }
  }

  return null
}

// Função principal que tenta BrasilAPI primeiro, depois Nominatim
async function buscarCoordenadas(
  endereco: string,
  bairro: string,
  cidade: string,
  uf: string,
  cep: string,
): Promise<{ lat: number; lng: number } | null> {
  // 1. Tentar BrasilAPI primeiro (mais precisa para CEPs brasileiros)
  const coordsBrasilAPI = await buscarCoordenadasPorCep(cep)
  if (coordsBrasilAPI) {
    console.log(`[v0] Coordenadas encontradas via BrasilAPI: ${coordsBrasilAPI.lat}, ${coordsBrasilAPI.lng}`)
    return coordsBrasilAPI
  }

  // 2. Fallback para Nominatim
  const coordsNominatim = await buscarCoordenadasNominatim(endereco, bairro, cidade, uf)
  if (coordsNominatim) {
    console.log(`[v0] Coordenadas encontradas via Nominatim: ${coordsNominatim.lat}, ${coordsNominatim.lng}`)
    return coordsNominatim
  }

  console.log("[v0] Nenhuma coordenada encontrada")
  return null
}

export async function POST(request: Request) {
  try {
    const { cepCliente } = await request.json()
    console.log("[v0] calcular-distancia - CEP recebido:", cepCliente)

    if (!cepCliente) {
      return NextResponse.json({ success: false, message: "CEP do cliente é obrigatório" }, { status: 400 })
    }

    // Buscar coordenadas da empresa do banco de dados
    console.log("[v0] calcular-distancia - Buscando config da empresa...")
    const [configRows] = await pool.execute("SELECT empresa_latitude, empresa_longitude FROM timbrado_config LIMIT 1")
    console.log("[v0] calcular-distancia - configRows:", JSON.stringify(configRows))

    if (!Array.isArray(configRows) || configRows.length === 0) {
      console.log("[v0] calcular-distancia - Nenhuma config encontrada")
      return NextResponse.json(
        {
          success: false,
          message: "Configurações da empresa não encontradas. Configure o endereço da empresa primeiro.",
        },
        { status: 404 },
      )
    }

    const config = configRows[0] as any
    console.log("[v0] calcular-distancia - config raw:", config)
    const latEmpresa = Number(config.empresa_latitude)
    const lonEmpresa = Number(config.empresa_longitude)
    console.log("[v0] calcular-distancia - Coords empresa:", latEmpresa, lonEmpresa)

    if (!latEmpresa || !lonEmpresa) {
      console.log("[v0] calcular-distancia - Coords vazias")
      return NextResponse.json(
        {
          success: false,
          message: "Coordenadas da empresa não cadastradas. Configure o endereço da empresa primeiro.",
        },
        { status: 400 },
      )
    }

    // Buscar endereço do cliente via ViaCEP
    const cepLimpo = cepCliente.replace(/\D/g, "")
    console.log("[v0] calcular-distancia - Buscando ViaCEP:", cepLimpo)
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const enderecoData = await viaCepResponse.json()
    console.log("[v0] calcular-distancia - ViaCEP resposta:", JSON.stringify(enderecoData))

    if (enderecoData.erro) {
      return NextResponse.json({ success: false, message: "CEP não encontrado" }, { status: 404 })
    }

    // Buscar coordenadas do cliente (BrasilAPI primeiro, depois Nominatim como fallback)
    console.log("[v0] calcular-distancia - Buscando coordenadas (BrasilAPI/Nominatim)...")
    const coordenadasCliente = await buscarCoordenadas(
      enderecoData.logradouro || "",
      enderecoData.bairro || "",
      enderecoData.localidade,
      enderecoData.uf,
      cepLimpo,
    )
    console.log("[v0] calcular-distancia - Coords cliente:", JSON.stringify(coordenadasCliente))

    if (!coordenadasCliente) {
      console.log("[v0] calcular-distancia - Coords cliente não encontradas")
      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível obter as coordenadas do endereço do cliente",
        },
        { status: 404 },
      )
    }

    // Calcular distância
    const distanciaKm = calcularDistanciaHaversine(
      latEmpresa,
      lonEmpresa,
      coordenadasCliente.lat,
      coordenadasCliente.lng,
    )

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
