"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Users,
  Package,
  FileText,
  FileSignature,
  File,
  DollarSign,
  Wrench,
  UserCog,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
} from "lucide-react"
import { useSidebar } from "@/components/sidebar-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { useLogos } from "@/hooks/use-logos"

interface MenuItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    permission: "dashboard",
  },
  {
    title: "Ordem de Serviço",
    href: "/ordem-servico",
    icon: Wrench,
    permission: "ordem_servico",
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    permission: "clientes",
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
    permission: "produtos",
  },
  {
    title: "Orçamentos",
    href: "/orcamentos",
    icon: FileText,
    permission: "orcamentos",
  },
  {
    title: "Proposta e Contratos",
    href: "/contratos",
    icon: FileSignature,
    permission: "contratos",
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: File,
    permission: "documentos",
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    permission: "financeiro",
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    permission: "relatorios",
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: UserCog,
    permission: "usuarios",
  },
  {
    title: "Logs",
    href: "/logs",
    icon: Activity,
    permission: "logs",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    permission: "configuracoes",
  },
]

export function AppSidebar() {
  const { isOpen, setIsOpen, isCollapsed, isMobile, toggle } = useSidebar()
  const { hasPermission, userType, isAdmin } = usePermissions()
  const pathname = usePathname()
  const { logos, loading: logosLoading } = useLogos()

  // Filtrar itens do menu baseado nas permissões
  const filteredMenuItems = menuItems.filter((item) => {
    // Admin vê tudo
    if (isAdmin) return true

    // Verificar permissão específica
    return hasPermission(item.permission)
  })

  // Fechar sidebar quando clicar em um link no mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  // Overlay para mobile
  const renderOverlay = () => {
    if (!isMobile || !isOpen) return null

    return <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
  }

  // Determinar largura do sidebar
  const getSidebarWidth = () => {
    if (isMobile) {
      return "w-80"
    }
    return isCollapsed ? "w-16" : "w-64"
  }

  // Determinar se deve mostrar o sidebar
  const shouldShowSidebar = isMobile ? isOpen : true

  return (
    <>
      {renderOverlay()}

      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full flex flex-col border-r bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 transform",
          getSidebarWidth(),
          shouldShowSidebar ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-blue-700/50">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 flex items-center justify-center">
                {!logosLoading && logos.menu ? (
                  <img
                    src={logos.menu || "/placeholder.svg"}
                    alt="Logo"
                    className="h-8 w-8 object-contain rounded"
                    style={{
                      imageRendering: "auto",
                      WebkitImageSmoothing: true,
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">GF</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Gestor Financeiro</h2>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={isMobile ? () => setIsOpen(false) : toggle}
            className="h-8 w-8 hover:bg-blue-700/50 text-white"
          >
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Type Badge */}
        {(!isCollapsed || isMobile) && (
          <div className="px-4 py-2">
            <Badge variant={isAdmin ? "default" : "secondary"} className="w-full justify-center">
              {userType === "admin" && "Administrador"}
              {userType === "tecnico" && "Técnico"}
              {userType === "vendedor" && "Vendedor"}
              {userType === "usuario" && "Usuário"}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-10 transition-all duration-200",
                      isCollapsed && !isMobile ? "px-2" : "px-3",
                      isActive && "bg-blue-700 text-white border-r-2 border-blue-300",
                      !isActive && "hover:bg-blue-700/50 text-blue-100",
                    )}
                    title={isCollapsed && !isMobile ? item.title : undefined}
                  >
                    <Icon className={cn("h-4 w-4", isCollapsed && !isMobile ? "mx-auto" : "mr-3")} />
                    {(!isCollapsed || isMobile) && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <Badge variant={item.badgeVariant || "secondary"} className="ml-2 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-blue-700/50 p-4">
          {(!isCollapsed || isMobile) && (
            <div className="text-xs text-blue-200 text-center">
              <p>Gestor Financeiro v1.0</p>
              <p className="mt-1">{filteredMenuItems.length} módulos disponíveis</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
