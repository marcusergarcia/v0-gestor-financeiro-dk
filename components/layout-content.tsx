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
    // Reset scroll position of the main layout container, wrapper, and window on route change
    const mainElement = document.querySelector("main")
    if (mainElement) {
      mainElement.scrollTop = 0
    }
    const layoutWrapper = document.getElementById("layout-wrapper")
    if (layoutWrapper) {
      layoutWrapper.scrollTop = 0
    }
    window.scrollTo({ top: 0 })
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }, [pathname])

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
      <div className="flex h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Animated background blobs for the loading state */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px] pointer-events-none -z-10" style={{ animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        
        <div className="text-center space-y-4 relative z-10">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
            <div className="w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground tracking-tight font-display">Carregando</h3>
            <p className="text-sm text-muted-foreground">Por favor, aguarde um instante...</p>
          </div>
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
      <div className="flex h-screen bg-gradient-to-br from-[#e2e8f0] via-[#f1f5f9] to-[#dbeafe]/80 dark:from-slate-950 dark:via-background dark:to-blue-950/20 relative overflow-hidden">
        {/* Modern decorative blurred background blobs for a premium visual aesthetic */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-accent/8 blur-[160px] pointer-events-none -z-10" style={{ animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        
        <AppSidebar />
        <div id="layout-wrapper" className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Header />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
