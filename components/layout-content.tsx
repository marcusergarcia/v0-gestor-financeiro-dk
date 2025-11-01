"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SidebarProvider } from "@/components/sidebar-provider"
import { AppSidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { getFirstAvailableRoute, canAccessRoute } from "@/lib/redirect-helper"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Não executar até estar montado
    if (!mounted || loading) return

    const publicPaths = ["/login", "/sem-permissoes"]
    const isPublicPath = publicPaths.includes(pathname)

    console.log("=== LayoutContent Check ===")
    console.log("User:", user?.nome)
    console.log("Pathname:", pathname)
    console.log("Is Public:", isPublicPath)

    // Se não está autenticado e não está em rota pública, redirecionar para login
    if (!user && !isPublicPath) {
      console.log("Redirecionando para login...")
      router.push("/login")
      return
    }

    // Se está autenticado e está na página de login, redirecionar
    if (user && pathname === "/login") {
      console.log("Usuário logado, redirecionando da página de login...")
      const firstRoute = getFirstAvailableRoute(user)
      console.log("Primeira rota:", firstRoute)
      router.push(firstRoute)
      return
    }

    // Se está autenticado e está na raiz, redirecionar
    if (user && pathname === "/") {
      console.log("Usuário na raiz, redirecionando...")
      const firstRoute = getFirstAvailableRoute(user)
      console.log("Primeira rota:", firstRoute)
      router.push(firstRoute)
      return
    }

    // Verificar permissões para rotas protegidas
    if (user && !isPublicPath && pathname !== "/") {
      const hasAccess = canAccessRoute(user, pathname)
      console.log("Tem acesso?", hasAccess)

      if (!hasAccess) {
        console.log("Sem permissão, redirecionando...")
        const firstRoute = getFirstAvailableRoute(user)
        router.push(firstRoute)
        return
      }
    }
  }, [user, loading, pathname, router, mounted])

  // Enquanto não montado, não renderizar nada
  if (!mounted) {
    return null
  }

  // Mostrar loading apenas se realmente estiver carregando
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  const publicPaths = ["/login", "/sem-permissoes"]
  const isPublicPath = publicPaths.includes(pathname)

  // Se está na página de login ou sem permissões, renderiza apenas o conteúdo
  if (isPublicPath) {
    return <>{children}</>
  }

  // Se não está autenticado, não renderiza nada (vai redirecionar)
  if (!user) {
    return null
  }

  // Se está logado e em rota protegida, renderiza o layout completo
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
