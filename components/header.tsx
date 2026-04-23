"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Search,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  PartyPopper,
  Menu,
  Settings,
  LogOut,
  Crown,
  Shield,
  ChevronDown,
  Clock,
  X,
} from "lucide-react"
import Link from "next/link"
import { useSidebar } from "./sidebar-provider"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface Feriado {
  id: number
  data: string
  nome: string
  tipo: string
}

interface BoletoVencido {
  id: number
  numero: string
  cliente_nome: string
  valor: number
  data_vencimento: string
  status: string
}

export function Header() {
  const { toggleSidebar } = useSidebar()
  const { user, logout } = useAuth()
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [boletosVencidos, setBoletosVencidos] = useState<BoletoVencido[]>([])
  const [currentDate, setCurrentDate] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadNotifications()
    setCurrentDateAndWelcome()
  }, [])

  useEffect(() => {
    if (isNotificationOpen) {
      loadNotifications()
    }
  }, [isNotificationOpen])

  const setCurrentDateAndWelcome = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
    const dateString = now.toLocaleDateString("pt-BR", options)
    setCurrentDate(dateString)

    const hour = now.getHours()
    let message = ""
    if (hour < 12) {
      message = "Bom dia"
    } else if (hour < 18) {
      message = "Boa tarde"
    } else {
      message = "Boa noite"
    }
    setWelcomeMessage(message)
  }

  const parseDate = (dateString: string): Date | null => {
    try {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split("-")
        return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 0, 0, 0, 0)
      }

      if (dateString.includes("T")) {
        return new Date(dateString)
      }

      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split("/")
        return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      }

      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return null
      }
      return date
    } catch (error) {
      console.error("Erro ao fazer parse da data:", dateString, error)
      return null
    }
  }

  const loadNotifications = async () => {
    try {
      const feriadosResponse = await fetch("/api/configuracoes/feriados")
      if (feriadosResponse.ok) {
        const feriadosResult = await feriadosResponse.json()
        if (feriadosResult.success) {
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()
          const feriadosDoMes = feriadosResult.data.filter((feriado: Feriado) => {
            const feriadoDate = parseDate(feriado.data)
            if (!feriadoDate) return false
            return feriadoDate.getMonth() === currentMonth && feriadoDate.getFullYear() === currentYear
          })
          setFeriados(feriadosDoMes)
        }
      }

      const boletosResponse = await fetch("/api/boletos")
      if (boletosResponse.ok) {
        const boletosResult = await boletosResponse.json()

        if (boletosResult.success && Array.isArray(boletosResult.data)) {
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)

          const vencidos = boletosResult.data.filter((boleto: any) => {
            if (boleto.status === "vencido") {
              return true
            }

            if (boleto.status === "pendente" && boleto.data_vencimento) {
              const dataStr = boleto.data_vencimento.split("T")[0]

              if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dataStr.split("-")
                const vencimento = new Date(
                  Number.parseInt(year),
                  Number.parseInt(month) - 1,
                  Number.parseInt(day),
                  0,
                  0,
                  0,
                  0,
                )
                return vencimento < hoje
              }
            }

            return false
          })

          setBoletosVencidos(vencidos)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes("-")) {
        const parts = dateString.split("T")[0].split("-")
        if (parts.length === 3) {
          const [year, month, day] = parts
          return `${day}/${month}`
        }
      }

      if (dateString.includes("/")) {
        const [day, month] = dateString.split("/")
        return `${day}/${month}`
      }

      return dateString
    } catch (error) {
      console.error("Erro ao formatar data:", dateString, error)
      return dateString
    }
  }

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case "admin":
        return { bg: "bg-primary/10", text: "text-primary", icon: Crown, label: "Admin" }
      case "tecnico":
        return { bg: "bg-accent/10", text: "text-accent", icon: Shield, label: "Técnico" }
      case "vendedor":
        return { bg: "bg-[hsl(var(--success))]/10", text: "text-[hsl(var(--success))]", icon: User, label: "Vendedor" }
      case "usuario":
        return { bg: "bg-muted", text: "text-muted-foreground", icon: User, label: "Usuário" }
      default:
        return { bg: "bg-muted", text: "text-muted-foreground", icon: User, label: tipo }
    }
  }

  const totalNotifications = feriados.length + boletosVencidos.length
  const tipoConfig = getTipoConfig(user?.tipo || "")
  const TipoIcon = tipoConfig.icon

  return (
    <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Lado Esquerdo */}
        <div className="flex items-center gap-4">
          {/* Menu Hamburger (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-muted rounded-xl h-10 w-10"
            onClick={toggleSidebar}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </Button>

          {/* Data e Saudação */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground capitalize">{currentDate}</span>
            </div>
          </div>

          {/* Busca Desktop */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar clientes, orçamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-72 xl:w-96 h-10 bg-muted/50 border-0 focus:bg-card focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
            />
          </div>
        </div>

        {/* Lado Direito */}
        <div className="flex items-center gap-2">
          {/* Busca Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-muted rounded-xl h-10 w-10"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Buscar"
          >
            {isSearchOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Search className="w-5 h-5 text-foreground" />
            )}
          </Button>

          {/* Notificações */}
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted rounded-xl h-10 w-10"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-40" />
                    <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {totalNotifications > 9 ? "9+" : totalNotifications}
                    </span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-xl shadow-xl border-border" align="end">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      Notificações
                    </CardTitle>
                    {totalNotifications > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {totalNotifications}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-80 overflow-y-auto">
                  {/* Feriados do mês */}
                  {feriados.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <PartyPopper className="w-4 h-4 text-[hsl(var(--success))]" />
                        <span className="font-medium text-sm">Feriados deste mês</span>
                      </div>
                      <div className="space-y-2">
                        {feriados.map((feriado) => (
                          <div
                            key={feriado.id}
                            className="flex items-center justify-between p-3 bg-[hsl(var(--success))]/5 rounded-lg border border-[hsl(var(--success))]/20"
                          >
                            <div>
                              <p className="font-medium text-sm">{feriado.nome}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(feriado.data)}</p>
                            </div>
                            <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-0 text-xs">
                              {feriado.tipo}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {feriados.length > 0 && boletosVencidos.length > 0 && <Separator />}

                  {/* Boletos vencidos */}
                  {boletosVencidos.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="font-medium text-sm">
                            Boletos vencidos ({boletosVencidos.length})
                          </span>
                        </div>
                        <Link href="/financeiro?status=vencido">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => setIsNotificationOpen(false)}
                          >
                            Ver todos
                          </Button>
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {boletosVencidos.slice(0, 3).map((boleto) => (
                          <div
                            key={boleto.id}
                            className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20"
                          >
                            <div>
                              <p className="font-medium text-sm">{boleto.numero}</p>
                              <p className="text-xs text-muted-foreground">{boleto.cliente_nome}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-destructive">{formatCurrency(boleto.valor)}</p>
                              <p className="text-xs text-muted-foreground">Venc: {formatDate(boleto.data_vencimento)}</p>
                            </div>
                          </div>
                        ))}
                        {boletosVencidos.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            E mais {boletosVencidos.length - 3} boleto(s) vencido(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {totalNotifications === 0 && (
                    <div className="text-center py-10 px-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Tudo em dia</p>
                      <p className="text-xs text-muted-foreground mt-1">Nenhuma notificação no momento</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>

          {/* Separador */}
          <div className="hidden md:block h-8 w-px bg-border mx-1" />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 md:px-3 py-2 h-auto hover:bg-muted rounded-xl transition-all duration-200"
              >
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage src="/placeholder.svg" alt={user?.nome} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {user ? getInitials(user.nome) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {user?.nome?.split(" ")[0]}
                  </span>
                  <span className={cn("text-xs", tipoConfig.text)}>
                    {tipoConfig.label}
                  </span>
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl border-border p-2">
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user ? getInitials(user.nome) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{user?.nome}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <div className="px-2 py-2 mb-2 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">{welcomeMessage}!</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className="capitalize">{currentDate}</span>
                </div>
              </div>
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                onClick={logout}
                className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra de Busca Mobile */}
      {isSearchOpen && (
        <div className="lg:hidden px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar clientes, orçamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full h-10 bg-muted/50 border-0 focus:bg-card focus:ring-2 focus:ring-primary/20 rounded-xl"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
