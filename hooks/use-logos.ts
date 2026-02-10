"use client"

import { useState, useEffect } from "react"

interface Logos {
  favicon: string | null
  menu: string | null
  impressao: string | null
}

// Cache global para evitar múltiplas requisições
let cachedLogos: Logos | null = null
let loadingPromise: Promise<Logos> | null = null

export async function preloadLogos(): Promise<Logos> {
  // Se já tem cache, retorna
  if (cachedLogos) {
    return cachedLogos
  }

  // Se já está carregando, espera a promise existente
  if (loadingPromise) {
    return loadingPromise
  }

  // Cria nova promise de carregamento
  loadingPromise = fetch("/api/configuracoes/logos")
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao carregar logos")
      return res.json()
    })
    .then((result) => {
      if (!result.success || !result.data) {
        throw new Error("Dados inválidos")
      }

      const logos: Logos = {
        favicon: null,
        menu: null,
        impressao: null,
      }

      let sistemaLogoSrc: string | null = null
      let menuLogoSrc: string | null = null

      result.data.forEach((logo: any) => {
        if (!logo.ativo || !logo.dados) return

        const logoSrc = logo.dados.startsWith("data:")
          ? logo.dados
          : `data:image/${logo.formato || "png"};base64,${logo.dados}`

        switch (logo.tipo) {
          case "sistema":
          case "favicon":
            logos.favicon = logoSrc
            sistemaLogoSrc = logoSrc
            break
          case "menu":
            menuLogoSrc = logoSrc
            break
          case "impressao":
            logos.impressao = logoSrc
            break
        }
      })

      // Para o menu/sidebar: usa logo "menu" se existir, senao usa logo "sistema"
      logos.menu = menuLogoSrc || sistemaLogoSrc

      cachedLogos = logos
      loadingPromise = null
      return logos
    })
    .catch((error) => {
      console.error("Erro ao carregar logos:", error)
      loadingPromise = null
      // Retorna logos vazios em caso de erro
      const emptyLogos: Logos = {
        favicon: null,
        menu: null,
        impressao: null,
      }
      cachedLogos = emptyLogos
      return emptyLogos
    })

  return loadingPromise
}

export function useLogos() {
  const [logos, setLogos] = useState<Logos>({
    favicon: null,
    menu: null,
    impressao: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    preloadLogos()
      .then((loadedLogos) => {
        if (mounted) {
          setLogos(loadedLogos)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Erro no useLogos:", err)
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const clearCache = () => {
    cachedLogos = null
    loadingPromise = null
  }

  return { logos, loading, error, clearCache }
}
