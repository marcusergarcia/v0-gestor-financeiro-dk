"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

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

      const response = await fetch("/api/utils/calcular-distancia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cepCliente: cepLimpo }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Distância calculada!",
          description: `Distância: ${result.data.distanciaKm} km`,
        })
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
