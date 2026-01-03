"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { useSidebar } from "./sidebar-provider"
import { useAuth } from "@/contexts/auth-context"
import { useLogos } from "@/hooks/use-logos"

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
  const { logos, loading: logosLoading } = useLogos()
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [boletosVencidos, setBoletosVencidos] = useState<BoletoVencido[]>([])
  const [location, setLocation] = useState({ cidade: "São Paulo", estado: "SP" })
  const [currentDate, setCurrentDate] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadNotifications()
    setCurrentDateAndWelcome()

    // Verificar se é mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Recarregar notificações quando o popover abrir
  useEffect(() => {
    if (isNotificationOpen) {
      loadNotifications()
    }
  }, [isNotificationOpen])

  const setCurrentDateAndWelcome = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
      // Se a data vem no formato YYYY-MM-DD (formato do banco)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split("-")
        // Cria data local sem conversão UTC
        return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      }

      // Se a data já vem no formato ISO com timezone
      if (dateString.includes("T")) {
        return new Date(dateString)
      }

      // Se a data vem no formato DD/MM/YYYY
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split("/")
        return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      }

      // Tentar parsing direto como último recurso
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
      // Carregar feriados do mês atual
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

      // Carregar boletos vencidos
      const boletosResponse = await fetch("/api/boletos")
      if (boletosResponse.ok) {
        const boletosResult = await boletosResponse.json()

        if (boletosResult.success && Array.isArray(boletosResult.data)) {
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)

          const vencidos = boletosResult.data.filter((boleto: any) => {
            if (boleto.status !== "pendente" && boleto.status !== "vencido") {
              return false
            }

            const vencimento = parseDate(boleto.data_vencimento)
            if (!vencimento) return false

            vencimento.setHours(0, 0, 0, 0)
            return vencimento < hoje
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
      // Se a data vem no formato YYYY-MM-DD (formato do banco)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split("-")
        return `${day}/${month}`
      }

      // Se a data vem no formato ISO com timezone
      if (dateString.includes("T")) {
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        return `${day}/${month}`
      }

      // Se a data já vem no formato DD/MM/YYYY
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month] = dateString.split("/")
        return `${day}/${month}`
      }

      // Fallback: tentar usar parseDate
      const date = parseDate(dateString)
      if (!date) return dateString
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      return `${day}/${month}`
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

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "tecnico":
        return "bg-blue-100 text-blue-800"
      case "vendedor":
        return "bg-green-100 text-green-800"
      case "usuario":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "admin":
        return <Crown className="w-3 h-3" />
      case "tecnico":
        return <Shield className="w-3 h-3" />
      default:
        return <User className="w-3 h-3" />
    }
  }

  const totalNotifications = feriados.length + boletosVencidos.length

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Botão do menu hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-gray-100 transition-colors duration-200 rounded-xl"
            onClick={toggleSidebar}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </Button>

          <div className="flex items-center gap-3">
            {/* Logo do menu - sempre mostra fallback se não carregar */}
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
                  onError={(e) => {
                    // Se der erro ao carregar, mostra fallback
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : null}
              {/* Fallback sempre presente */}
              {(logosLoading || !logos.menu) && (
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GF</span>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gestor Financeiro
              </h1>
            </div>
          </div>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar clientes, orçamentos..."
              className="pl-10 w-64 md:w-80 lg:w-96 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Botão de busca em telas pequenas */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100 transition-colors duration-200 rounded-xl"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </Button>

          {/* Notificações */}
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 transition-colors duration-200 rounded-xl"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {totalNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 animate-pulse">
                    {totalNotifications}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notificações
                  </CardTitle>
                  <CardDescription>
                    {totalNotifications > 0
                      ? `Você tem ${totalNotifications} notificação${totalNotifications > 1 ? "ões" : ""}`
                      : "Nenhuma notificação"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Feriados do mês */}
                  {feriados.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PartyPopper className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm text-green-700">Feriados deste mês</span>
                      </div>
                      <div className="space-y-2">
                        {feriados.map((feriado) => (
                          <div
                            key={feriado.id}
                            className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div>
                              <p className="font-medium text-sm text-green-800">{feriado.nome}</p>
                              <p className="text-xs text-green-600">{formatDate(feriado.data)}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">{feriado.tipo}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {feriados.length > 0 && boletosVencidos.length > 0 && <Separator />}

                  {/* Boletos vencidos */}
                  {boletosVencidos.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-sm text-red-700">
                            Boletos vencidos ({boletosVencidos.length})
                          </span>
                        </div>
                        <Link href="/financeiro?status=vencido">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
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
                            className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div>
                              <p className="font-medium text-sm text-red-800">{boleto.numero}</p>
                              <p className="text-xs text-red-600">{boleto.cliente_nome}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm text-red-800">{formatCurrency(boleto.valor)}</p>
                              <p className="text-xs text-red-600">Venc: {formatDate(boleto.data_vencimento)}</p>
                            </div>
                          </div>
                        ))}
                        {boletosVencidos.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            E mais {boletosVencidos.length - 3} boleto(s) vencido(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {totalNotifications === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação no momento</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-gray-100 transition-colors duration-200 rounded-xl"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt={user?.nome} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                    {user ? getInitials(user.nome) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700">{user?.nome}</p>
                  <Badge className={`text-xs ${getTipoColor(user?.tipo || "")}`}>
                    {getTipoIcon(user?.tipo || "")}
                    <span className="ml-1">{user?.tipo}</span>
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{welcomeMessage}!</p>
                  </div>
                  <p className="text-sm font-medium">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="capitalize">{currentDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {location.cidade}, {location.estado}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
