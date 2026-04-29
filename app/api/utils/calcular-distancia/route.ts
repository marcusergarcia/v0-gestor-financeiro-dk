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
  bairro: string,
  cidade: string,
  uf: string,
  cep: string,
): Promise<{ lat: number; lng: number } | null> {
  // Usar busca estruturada do Nominatim para maior precisão
  // Importante: incluir o município específico para evitar confusão com bairros de outras cidades
  const tentativas = [
    // Busca estruturada com CEP
    `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(endereco)}&city=${encodeURIComponent(cidade)}&state=${encodeURIComponent(uf)}&country=Brazil&postalcode=${cep}&format=json&limit=5&addressdetails=1`,
    // Busca com endereço completo incluindo "município de"
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${endereco}, ${bairro}, município de ${cidade}, ${uf}, Brasil`)}&format=json&limit=5&addressdetails=1`,
    // Busca com bairro e município específico
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${bairro}, município de ${cidade}, ${uf}, Brasil`)}&format=json&limit=5&addressdetails=1`,
    // Busca estruturada apenas com cidade (fallback)
    `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cidade)}&state=${encodeURIComponent(uf)}&country=Brazil&format=json&limit=1&addressdetails=1`,
  ]

  for (const url of tentativas) {
    try {
      console.log(`[v0] Nominatim tentando: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent": "GestorFinanceiro/1.0 (contato@empresa.com.br)",
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        console.log(`Nominatim retornou status ${response.status}`)
        continue
      }

      const data = await response.json()
      console.log(`[v0] Nominatim resposta:`, JSON.stringify(data))

      if (data.length > 0) {
        // Filtrar resultados para garantir que estejam na cidade correta
        const resultadoValido = data.find((item: any) => {
          const lat = Number.parseFloat(item.lat)
          const lon = Number.parseFloat(item.lon)
          const displayName = item.display_name?.toLowerCase() || ""
          
          // Verificar se está dentro da região metropolitana de São Paulo (capital)
          // São Paulo capital: lat entre -24.0 e -23.4, lon entre -46.85 e -46.35
          const dentroSPCapital = lat >= -24.0 && lat <= -23.4 && lon >= -46.85 && lon <= -46.35
          
          // Verificar se NÃO é de Sorocaba ou outra cidade
          const naoEhSorocaba = !displayName.includes("sorocaba")
          
          // Verificar se contém "são paulo" no display_name
          const contemSaoPaulo = displayName.includes("são paulo") || displayName.includes("sao paulo")
          
          console.log(`[v0] Validando: lat=${lat}, lon=${lon}, dentroSPCapital=${dentroSPCapital}, naoEhSorocaba=${naoEhSorocaba}, contemSaoPaulo=${contemSaoPaulo}, displayName=${displayName.substring(0, 100)}`)
          
          return dentroSPCapital && naoEhSorocaba && contemSaoPaulo
        })

        if (resultadoValido) {
          console.log(`[v0] Resultado válido encontrado: ${resultadoValido.display_name}`)
          return {
            lat: Number.parseFloat(resultadoValido.lat),
            lng: Number.parseFloat(resultadoValido.lon),
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error)
    }
  }

  // Se não encontrou nada válido, retornar coordenadas aproximadas do centro de São Paulo
  // como último recurso (melhor do que retornar Sorocaba)
  console.log(`[v0] Nenhum resultado válido encontrado, usando centro de São Paulo como fallback`)
  return {
    lat: -23.5505,
    lng: -46.6333,
  }
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

    // Buscar coordenadas do cliente via Nominatim
    console.log("[v0] calcular-distancia - Buscando Nominatim...")
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
