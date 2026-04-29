"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

// Função para buscar coordenadas via Nominatim (funciona no navegador)
async function buscarCoordenadasNominatim(
  endereco: string,
  bairro: string,
  cidade: string,
  uf: string
): Promise<{ lat: number; lng: number } | null> {
  // Tentar várias combinações de busca
  const queries = [
    `${endereco}, ${bairro}, ${cidade}, ${uf}, Brasil`,
    `${bairro}, ${cidade}, ${uf}, Brasil`,
    `${cidade}, ${uf}, Brasil`,
  ].filter(q => q.replace(/,/g, "").trim().length > 10)

  for (const searchQuery of queries) {
    try {
      const encodedQuery = encodeURIComponent(searchQuery)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=br`,
        {
          headers: {
            "User-Agent": "GestorFinanceiro/1.0",
          },
        }
      )

      const data = await response.json()

      if (data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }
    } catch (err) {
      console.error("Erro ao buscar coordenadas:", err)
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
      const coordenadasCliente = await buscarCoordenadasNominatim(
        enderecoData.logradouro || "",
        enderecoData.bairro || "",
        enderecoData.localidade,
        enderecoData.uf
      )

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
