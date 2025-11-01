"use client"

import { useState } from "react"

interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

interface Coordenadas {
  lat: number
  lng: number
}

export function useCep() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscarCep = async (cep: string): Promise<CepData | null> => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, "")

    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length !== 8) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError("CEP não encontrado")
        return null
      }

      return data
    } catch (err) {
      setError("Erro ao buscar CEP")
      console.error("Erro ao buscar CEP:", err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const buscarCoordenadas = async (endereco: string, cidade: string, uf: string): Promise<Coordenadas | null> => {
    try {
      // Construir query de busca para Nominatim (OpenStreetMap)
      const searchQuery = `${endereco}, ${cidade}, ${uf}, Brazil`
      const encodedQuery = encodeURIComponent(searchQuery)

      // Buscar coordenadas no Nominatim
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
    } catch (err) {
      console.error("Erro ao buscar coordenadas:", err)
      return null
    }
  }

  return { buscarCep, buscarCoordenadas, loading, error }
}
