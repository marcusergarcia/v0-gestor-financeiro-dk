"use client"

import { useState } from "react"

export function useDistancia() {
  const [loading, setLoading] = useState(false)

  const calcularDistancia = async (cepCliente: string): Promise<number | null> => {
    const cepLimpo = cepCliente.replace(/\D/g, "")

    if (cepLimpo.length !== 8) {
      return null
    }

    try {
      setLoading(true)

      const response = await fetch("/api/utils/calcular-distancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cepCliente: cepLimpo }),
      })

      const result = await response.json()

      if (result.success) {
        return result.data.distanciaKm
      } else {
        return null
      }
    } catch (error) {
      console.error("Erro ao calcular distância:", error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { calcularDistancia, loading }
}
