"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getFirstAvailableRoute } from "@/lib/redirect-helper"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirecionar para a primeira rota disponível
        const firstRoute = getFirstAvailableRoute(user)
        router.replace(firstRoute)
      } else {
        // Se não estiver autenticado, redirecionar para login
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#e2e8f0] via-[#f1f5f9] to-[#dbeafe]/80 dark:from-slate-950 dark:via-background dark:to-blue-950/20">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando sistema...</p>
      </div>
    </div>
  )
}
