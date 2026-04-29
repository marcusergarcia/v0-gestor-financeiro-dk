"use client"

import { useState } from "react"

export function useDistancia() {
  const [loading, setLoading] = useState(false)

  const calcularDistancia = async (cepCliente: string): Promise<number | null> => {
    const cepLimpo = cepCliente.replace(/\D/g, "")
    console.log("[v0] useDistancia - CEP limpo:", cepLimpo)

    if (cepLimpo.length !== 8) {
      console.log("[v0] useDistancia - CEP inválido, length:", cepLimpo.length)
      return null
    }

    try {
      setLoading(true)
      console.log("[v0] useDistancia - Chamando API...")

      const response = await fetch("/api/utils/calcular-distancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cepCliente: cepLimpo }),
      })

      const result = await response.json()
      console.log("[v0] useDistancia - Resposta API:", JSON.stringify(result))

      if (result.success) {
        return result.data.distanciaKm
      } else {
        console.log("[v0] useDistancia - Erro:", result.message)
        return null
      }
    } catch (error) {
      console.error("[v0] useDistancia - Erro catch:", error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { calcularDistancia, loading }
}
