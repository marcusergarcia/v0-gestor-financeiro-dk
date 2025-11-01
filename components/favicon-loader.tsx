"use client"

import { useEffect, useState } from "react"

export function FaviconLoader() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Timeout para evitar tentar carregar antes da API estar pronta
    const timeoutId = setTimeout(() => {
      loadFavicon()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  const loadFavicon = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      if (!response.ok) {
        console.warn("API de logos não disponível ainda")
        return
      }

      const result = await response.json()

      if (result.success && result.data) {
        const faviconLogo = result.data.find(
          (logo: any) => (logo.tipo === "sistema" || logo.tipo === "favicon") && logo.ativo && logo.dados,
        )

        if (faviconLogo) {
          // Remove favicons existentes
          const existingLinks = document.querySelectorAll("link[rel*='icon']")
          existingLinks.forEach((link) => link.remove())

          // Adiciona o novo favicon
          const link = document.createElement("link")
          link.rel = "icon"
          link.type = `image/${faviconLogo.formato || "png"}`

          const faviconSrc = faviconLogo.dados.startsWith("data:")
            ? faviconLogo.dados
            : `data:image/${faviconLogo.formato || "png"};base64,${faviconLogo.dados}`

          link.href = faviconSrc
          document.head.appendChild(link)
          setLoaded(true)
        }
      }
    } catch (error) {
      // Silenciar erro no console para não poluir - é esperado na primeira carga
      console.debug("Favicon será carregado quando a API estiver disponível")
    }
  }

  return null
}
