"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

// Função para buscar coordenadas via Nominatim usando parâmetros estruturados
async function buscarCoordenadasNominatim(
  endereco: string,
  bairro: string,
  cidade: string,
  uf: string,
  cep: string
): Promise<{ lat: number; lng: number } | null> {
  // Mapa de UF para nome completo do estado
  const estadosMap: Record<string, string> = {
    "AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas",
    "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo",
    "GO": "Goiás", "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul",
    "MG": "Minas Gerais", "PA": "Pará", "PB": "Paraíba", "PR": "Paraná",
    "PE": "Pernambuco", "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina",
    "SP": "São Paulo", "SE": "Sergipe", "TO": "Tocantins"
  }

  const estado = estadosMap[uf] || uf

  // Estratégias de busca com parâmetros estruturados (mais preciso)
  const tentativas = [
    // Tentativa 1: Busca estruturada com endereço completo
    `street=${encodeURIComponent(endereco)}&city=${encodeURIComponent(cidade)}&state=${encodeURIComponent(estado)}&country=Brazil&postalcode=${cep}`,
    // Tentativa 2: Busca estruturada só com cidade e estado
    `city=${encodeURIComponent(cidade)}&state=${encodeURIComponent(estado)}&country=Brazil`,
    // Tentativa 3: Query de texto com cidade e estado (fallback)
    `q=${encodeURIComponent(`${cidade}, ${estado}, Brasil`)}`,
  ]

  for (let i = 0; i < tentativas.length; i++) {
    try {
      console.log(`[v0] Tentativa ${i + 1} de geocoding:`, tentativas[i])
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${tentativas[i]}&format=json&limit=5&countrycodes=br`,
        {
          headers: {
            "User-Agent": "GestorFinanceiro/1.0 (contact@gestor.com)",
          },
        }
      )

      const data = await response.json()
      console.log(`[v0] Resultados da tentativa ${i + 1}:`, data.length)

      if (data.length > 0) {
        // Filtrar resultados que contenham a cidade correta no display_name
        const resultadoCorreto = data.find((item: any) => {
          const displayName = item.display_name.toLowerCase()
          const cidadeLower = cidade.toLowerCase()
          // Verificar se o resultado contém a cidade correta
          return displayName.includes(cidadeLower) && !displayName.includes("sorocaba")
        })

        if (resultadoCorreto) {
          console.log(`[v0] Resultado encontrado:`, resultadoCorreto.display_name)
          return {
            lat: Number.parseFloat(resultadoCorreto.lat),
            lng: Number.parseFloat(resultadoCorreto.lon),
          }
        }

        // Se não encontrou resultado filtrado, usar o primeiro resultado da busca estruturada (tentativas 0 e 1)
        if (i < 2 && data[0]) {
          console.log(`[v0] Usando primeiro resultado:`, data[0].display_name)
          return {
            lat: Number.parseFloat(data[0].lat),
            lng: Number.parseFloat(data[0].lon),
          }
        }
      }
    } catch (err) {
      console.error(`[v0] Erro na tentativa ${i + 1}:`, err)
    }
  }

  return null
}

export function useDistancia() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const calcularDistancia = async (cepCliente: string): Promise<number | null> => {
    const cepLimpo = cepCliente.replace(/\D/g, "")

    if (cepLimpo.length !== 8) {
      return null
    }

    try {
      setLoading(true)

      // 1. Buscar endereço do cliente via ViaCEP
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const enderecoData = await viaCepResponse.json()

      if (enderecoData.erro) {
        toast({
          title: "Erro",
          description: "CEP não encontrado",
          variant: "destructive",
        })
        return null
      }

      // 2. Buscar coordenadas do cliente via Nominatim (no navegador funciona!)
      console.log("[v0] Buscando coordenadas para:", enderecoData)
      const coordenadasCliente = await buscarCoordenadasNominatim(
        enderecoData.logradouro || "",
        enderecoData.bairro || "",
        enderecoData.localidade,
        enderecoData.uf,
        cepLimpo
      )
      console.log("[v0] Coordenadas encontradas:", coordenadasCliente)

      if (!coordenadasCliente) {
        toast({
          title: "Aviso",
          description: "Não foi possível obter as coordenadas do endereço",
          variant: "destructive",
        })
        return null
      }

      // 3. Enviar coordenadas do cliente para a API calcular a distância
      const response = await fetch("/api/utils/calcular-distancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordenadasCliente: {
            lat: coordenadasCliente.lat,
            lng: coordenadasCliente.lng,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        return result.data.distanciaKm
      } else {
        toast({
          title: "Aviso",
          description: result.message || "Não foi possível calcular a distância",
          variant: "destructive",
        })
        return null
      }
    } catch (error) {
      console.error("Erro ao calcular distância:", error)
      toast({
        title: "Erro",
        description: "Erro ao calcular distância. Tente novamente.",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return { calcularDistancia, loading }
}
