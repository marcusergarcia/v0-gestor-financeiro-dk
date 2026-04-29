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

// Função para buscar coordenadas via Nominatim (OpenStreetMap)
async function buscarCoordenadas(
  endereco: string,
  cidade: string,
  uf: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const searchQuery = `${endereco}, ${cidade}, ${uf}, Brazil`
    const encodedQuery = encodeURIComponent(searchQuery)

    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`, {
      headers: {
        "User-Agent": "GestorFinanceiro/1.0",
      },
    })

    const data = await response.json()

    if (data.length === 0) {
      return null
    }

    return {
      lat: Number.parseFloat(data[0].lat),
      lng: Number.parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error("Erro ao buscar coordenadas:", error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { cepCliente } = await request.json()

    if (!cepCliente) {
      return NextResponse.json({ success: false, message: "CEP do cliente é obrigatório" }, { status: 400 })
    }

    // Buscar coordenadas da empresa do banco de dados
    const [configRows] = await pool.execute("SELECT empresa_latitude, empresa_longitude FROM timbrado_config LIMIT 1")

    if (!Array.isArray(configRows) || configRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Configurações da empresa não encontradas. Configure o endereço da empresa primeiro.",
        },
        { status: 404 },
      )
    }

    const config = configRows[0] as any
    const latEmpresa = Number(config.empresa_latitude)
    const lonEmpresa = Number(config.empresa_longitude)

    if (!latEmpresa || !lonEmpresa) {
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
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const enderecoData = await viaCepResponse.json()

    if (enderecoData.erro) {
      return NextResponse.json({ success: false, message: "CEP não encontrado" }, { status: 404 })
    }

    // Buscar coordenadas do cliente via Nominatim
    const coordenadasCliente = await buscarCoordenadas(
      enderecoData.logradouro || "",
      enderecoData.localidade,
      enderecoData.uf,
    )

    if (!coordenadasCliente) {
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
