"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Calendar,
  FileCheck,
  Building2,
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
  group?: string
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    permission: "dashboard",
    group: "principal",
  },
  {
    title: "Ordem de Serviço",
    href: "/ordem-servico",
    icon: Wrench,
    permission: "ordem_servico",
    group: "operacional",
  },
  {
    title: "Calendário",
    href: "/calendario",
    icon: Calendar,
    permission: "ordem_servico",
    group: "operacional",
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    permission: "clientes",
    group: "cadastros",
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
    permission: "produtos",
    group: "cadastros",
  },
  {
    title: "Orçamentos",
    href: "/orcamentos",
    icon: FileText,
    permission: "orcamentos",
    group: "comercial",
  },
  {
    title: "Proposta e Contratos",
    href: "/contratos",
    icon: FileSignature,
    permission: "contratos",
    group: "comercial",
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: File,
    permission: "documentos",
    group: "comercial",
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    permission: "financeiro",
    group: "financeiro",
  },
  {
    title: "Notas Fiscais",
    href: "/nota-fiscal",
    icon: FileCheck,
    permission: "nota_fiscal",
    group: "financeiro",
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    permission: "relatorios",
    group: "financeiro",
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: UserCog,
    permission: "usuarios",
    group: "sistema",
  },
  {
    title: "Logs",
    href: "/logs",
    icon: Activity,
    permission: "logs",
    group: "sistema",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    permission: "configuracoes",
    group: "sistema",
  },
]

const groupLabels: Record<string, string> = {
  principal: "Principal",
  operacional: "Operacional",
  cadastros: "Cadastros",
  comercial: "Comercial",
  financeiro: "Financeiro",
  sistema: "Sistema",
}

export function AppSidebar() {
  const { isOpen, setIsOpen, isCollapsed, isMobile, toggle } = useSidebar()
  const { hasPermission, userType, isAdmin } = usePermissions()
  const pathname = usePathname()
  const { logos, loading: logosLoading } = useLogos()

  // Filtrar itens do menu baseado nas permissões
  const filteredMenuItems = menuItems.filter((item) => {
    if (isAdmin) return true
    return hasPermission(item.permission)
  })

  // Agrupar itens por grupo
  const groupedItems = filteredMenuItems.reduce(
    (acc, item) => {
      const group = item.group || "principal"
      if (!acc[group]) acc[group] = []
      acc[group].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  // Fechar sidebar quando clicar em um link no mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  // Overlay para mobile
  const renderOverlay = () => {
    if (!isMobile || !isOpen) return null

    return (
      <div
        className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />
    )
  }

  // Determinar largura do sidebar
  const getSidebarWidth = () => {
    if (isMobile) {
      return "w-72"
    }
    return isCollapsed ? "w-[70px]" : "w-64"
  }

  // Determinar se deve mostrar o sidebar
  const shouldShowSidebar = isMobile ? isOpen : true

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

    const menuButton = (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-11 transition-all duration-200 rounded-lg group relative overflow-hidden",
          isCollapsed && !isMobile ? "px-3" : "px-3",
          isActive && "bg-[hsl(var(--sidebar-accent))] text-white shadow-md",
          !isActive && "hover:bg-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]",
        )}
      >
        {/* Indicador de ativo */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
        )}
        
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-200",
            isCollapsed && !isMobile ? "mx-auto" : "mr-3",
            isActive ? "text-white" : "text-[hsl(var(--sidebar-foreground))] group-hover:text-white",
            "group-hover:scale-110",
          )}
        />
        {(!isCollapsed || isMobile) && (
          <>
            <span className={cn("flex-1 text-left text-sm font-medium", isActive && "text-white")}>
              {item.title}
            </span>
            {item.badge && (
              <Badge
                variant={item.badgeVariant || "secondary"}
                className="ml-2 text-xs bg-white/20 text-white border-0"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    )

    if (isCollapsed && !isMobile) {
      return (
        <TooltipProvider key={item.href} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={item.href} onClick={handleLinkClick}>
                {menuButton}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <Link key={item.href} href={item.href} onClick={handleLinkClick}>
        {menuButton}
      </Link>
    )
  }

  return (
    <>
      {renderOverlay()}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full flex flex-col transition-all duration-300 transform",
          "bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]",
          getSidebarWidth(),
          shouldShowSidebar ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-[hsl(var(--sidebar-accent))] shadow-lg">
                {!logosLoading && logos.menu ? (
                  <img
                    src={logos.menu || "/placeholder.svg"}
                    alt="Logo"
                    className="h-7 w-7 object-contain rounded"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Gestor Financeiro</h2>
                <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-70">Sistema de Gestão</p>
              </div>
            </div>
          )}

          {isCollapsed && !isMobile && (
            <div className="mx-auto h-9 w-9 flex items-center justify-center rounded-lg bg-[hsl(var(--sidebar-accent))] shadow-lg">
              {!logosLoading && logos.menu ? (
                <img
                  src={logos.menu || "/placeholder.svg"}
                  alt="Logo"
                  className="h-7 w-7 object-contain rounded"
                />
              ) : (
                <Building2 className="h-5 w-5 text-white" />
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={isMobile ? () => setIsOpen(false) : toggle}
            className={cn(
              "h-8 w-8 rounded-lg transition-all duration-200",
              "hover:bg-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]",
              isCollapsed && !isMobile && "hidden",
            )}
          >
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Type Badge */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 py-3">
            <div
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium",
                isAdmin
                  ? "bg-[hsl(var(--sidebar-accent))]/20 text-[hsl(var(--sidebar-accent))]"
                  : "bg-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]",
              )}
            >
              {userType === "admin" && "Administrador"}
              {userType === "tecnico" && "Técnico"}
              {userType === "vendedor" && "Vendedor"}
              {userType === "usuario" && "Usuário"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-4">
            {Object.entries(groupedItems).map(([group, items]) => (
              <div key={group}>
                {(!isCollapsed || isMobile) && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))]/50 px-3 mb-2">
                    {groupLabels[group] || group}
                  </p>
                )}
                {isCollapsed && !isMobile && <div className="h-px bg-[hsl(var(--sidebar-border))] mx-2 my-2" />}
                <div className="space-y-1">{items.map(renderMenuItem)}</div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Toggle Button (quando colapsado) */}
        {isCollapsed && !isMobile && (
          <div className="px-3 py-2 border-t border-[hsl(var(--sidebar-border))]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="w-full h-10 hover:bg-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
          {(!isCollapsed || isMobile) && (
            <div className="text-[10px] text-[hsl(var(--sidebar-foreground))]/50 text-center space-y-1">
              <p className="font-medium">Gestor Financeiro v2.0</p>
              <p>{filteredMenuItems.length} módulos disponíveis</p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
