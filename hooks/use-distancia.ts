"use client"

import { useState } from "react"

export interface ResultadoDistancia {
  distanciaKm: number
  coordenadasEmpresa: { latitude: number; longitude: number }
  coordenadasCliente: { latitude: number; longitude: number }
  erro?: string
}

export function useDistancia() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoDistancia | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const calcularDistancia = async (cepCliente: string): Promise<number | null> => {
    const cepLimpo = cepCliente.replace(/\D/g, "")

    if (cepLimpo.length !== 8) {
      return null
    }

    try {
      setLoading(true)
      setErro(null)
      setResultado(null)

      const response = await fetch("/api/utils/calcular-distancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cepCliente: cepLimpo }),
      })

      const result = await response.json()

      if (result.success) {
        setResultado(result.data)
        return result.data.distanciaKm
      } else {
        setErro(result.message || "Não foi possível calcular a distância")
        return null
      }
    } catch (error) {
      console.error("Erro ao calcular distância:", error)
      setErro("Erro de conexão ao calcular distância")
      return null
    } finally {
      setLoading(false)
    }
  }

  const limpar = () => {
    setResultado(null)
    setErro(null)
  }

  return { calcularDistancia, loading, resultado, erro, limpar }
}
