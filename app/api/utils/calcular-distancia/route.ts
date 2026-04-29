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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coordenadasCliente } = body

    // Validar coordenadas do cliente (enviadas pelo frontend)
    if (!coordenadasCliente || typeof coordenadasCliente.lat !== "number" || typeof coordenadasCliente.lng !== "number") {
      return NextResponse.json(
        { success: false, message: "Coordenadas do cliente são obrigatórias" },
        { status: 400 }
      )
    }

    // Buscar coordenadas da empresa do banco de dados
    const configRows = await query(
      "SELECT empresa_latitude, empresa_longitude FROM timbrado_config WHERE ativo = 1 ORDER BY id DESC LIMIT 1"
    ) as any[]

    if (!Array.isArray(configRows) || configRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Configurações da empresa não encontradas. Configure o endereço da empresa primeiro.",
        },
        { status: 404 }
      )
    }

    const config = configRows[0]
    const latEmpresa = config.empresa_latitude !== null ? Number(config.empresa_latitude) : null
    const lonEmpresa = config.empresa_longitude !== null ? Number(config.empresa_longitude) : null

    if (latEmpresa === null || lonEmpresa === null || isNaN(latEmpresa) || isNaN(lonEmpresa)) {
      return NextResponse.json(
        {
          success: false,
          message: "Coordenadas da empresa não cadastradas. Configure o endereço da empresa primeiro.",
        },
        { status: 400 }
      )
    }

    // Calcular distância usando Haversine
    const distanciaKm = calcularDistanciaHaversine(
      latEmpresa,
      lonEmpresa,
      coordenadasCliente.lat,
      coordenadasCliente.lng
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
      },
    })
  } catch (error) {
    console.error("Erro ao calcular distância:", error)
    return NextResponse.json({ success: false, message: "Erro ao calcular distância" }, { status: 500 })
  }
}
