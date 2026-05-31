"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ResizableTable, type ColumnDef } from "@/components/ui/resizable-table"
import { UserCog, Search, Shield, User, Users, CheckCircle, XCircle, Crown, RefreshCw, ChevronRight, MoreHorizontal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { NovoUsuarioDialog } from "@/components/usuarios/novo-usuario-dialog"
import { EditarUsuarioDialog } from "@/components/usuarios/editar-usuario-dialog"
import { ExcluirUsuarioDialog } from "@/components/usuarios/excluir-usuario-dialog"
import type { Usuario } from "@/types/usuario"
import { cn } from "@/lib/utils"

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([])
  const [busca, setBusca] = useState("")
  const [tipoCardFilter, setTipoCardFilter] = useState("todos")
  const [expandedUsuarioId, setExpandedUsuarioId] = useState<number | null>(null)
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [usuarioExcluindo, setUsuarioExcluindo] = useState<Usuario | null>(null)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false)

  const { toast } = useToast()

  const carregarUsuarios = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/usuarios")
      const data = await response.json()

      if (data.success) {
        setUsuarios(data.data)
        setUsuariosFiltrados(data.data)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarLogo = async () => {
    try {
      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()

      if (logoResult.success && logoResult.data) {
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
        if (logoMenuData && logoMenuData.caminho) {
          setLogoMenu(logoMenuData.caminho)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error)
    }
  }

  useEffect(() => {
    carregarUsuarios()
    carregarLogo()
  }, [])

  useEffect(() => {
    let filtrados = usuarios

    // Filtro do Card
    if (tipoCardFilter === "ativo") {
      filtrados = filtrados.filter((u) => u.ativo === true || (u.ativo as any) === 1)
    } else if (tipoCardFilter === "admin") {
      filtrados = filtrados.filter((u) => u.tipo === "admin")
    } else if (tipoCardFilter === "tecnico") {
      filtrados = filtrados.filter((u) => u.tipo === "tecnico")
    }

    // Filtro de Busca
    if (busca.trim() !== "") {
      const search = busca.toLowerCase()
      filtrados = filtrados.filter(
        (usuario) =>
          usuario.nome.toLowerCase().includes(search) ||
          usuario.email.toLowerCase().includes(search),
      )
    }

    setUsuariosFiltrados(filtrados)
  }, [busca, usuarios, tipoCardFilter])

  const getStatusBadge = (ativo: boolean | number) => {
    if (ativo === true || ativo === 1) {
      return (
        <Badge className="bg-green-950/40 text-green-400 border border-green-900/50 hover:bg-green-950/60">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/60">
          <XCircle className="w-3 h-3 mr-1" />
          Inativo
        </Badge>
      )
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "admin":
        return (
          <Badge className="bg-purple-950/40 text-purple-400 border border-purple-900/50">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case "tecnico":
        return (
          <Badge className="bg-blue-950/40 text-blue-400 border border-blue-900/50">
            <Shield className="w-3 h-3 mr-1" />
            Técnico
          </Badge>
        )
      case "usuario":
        return (
          <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
            <User className="w-3 h-3 mr-1" />
            Usuário
          </Badge>
        )
      case "vendedor":
        return (
          <Badge className="bg-yellow-950/40 text-yellow-400 border border-yellow-900/50">
            <Shield className="w-3 h-3 mr-1" />
            Vendedor
          </Badge>
        )
      default:
        return <Badge variant="secondary">-</Badge>
    }
  }

  const getPermissoesBadges = (permissoes?: string[]) => {
    // Garantir que permissoes seja sempre um array
    const permissoesArray = Array.isArray(permissoes) ? permissoes : []

    if (permissoesArray.length === 0) {
      return (
        <Badge variant="outline" className="text-xs bg-muted/20 border-border text-muted-foreground">
          Sem permissões
        </Badge>
      )
    }

    const permissoesLabels: Record<string, string> = {
      clientes: "Clientes",
      produtos: "Produtos",
      orcamentos: "Orçamentos",
      contratos: "Contratos",
      documentos: "Documentos",
      financeiro: "Financeiro",
      ordem_servico: "OS",
      calendario: "Calendário", // Adicionando label para calendário
      relatorios: "Relatórios",
      usuarios: "Usuários",
      logs: "Logs",
      configuracoes: "Config",
    }

    return (
      <div className="flex flex-wrap gap-1">
        {permissoesArray.slice(0, 3).map((permissao) => (
          <Badge key={permissao} variant="outline" className="text-xs bg-muted/20 border-border text-muted-foreground">
            {permissoesLabels[permissao] || permissao}
          </Badge>
        ))}
        {permissoesArray.length > 3 && (
          <Badge variant="outline" className="text-xs bg-muted/20 border-border text-muted-foreground">
            +{permissoesArray.length - 3}
          </Badge>
        )}
      </div>
    )
  }

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario)
    setEditarDialogOpen(true)
  }

  const handleExcluir = (usuario: Usuario) => {
    setUsuarioExcluindo(usuario)
    setExcluirDialogOpen(true)
  }

  const formatarData = (data: string | undefined) => {
    if (!data) return "-"
    try {
      const dateStr = String(data)
      let dateObj = null
      if (dateStr.includes("Z") || (dateStr.includes("-") && dateStr.includes("T"))) {
        dateObj = new Date(dateStr)
      } else {
        const isoStr = dateStr.replace(" ", "T") + (dateStr.endsWith("Z") ? "" : "Z")
        dateObj = new Date(isoStr)
      }
      return dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
        : "-"
    } catch {
      return "-"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <Skeleton className="h-8 w-48 bg-muted" />
            <Skeleton className="h-4 w-64 mt-2 bg-muted" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-4 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-muted" />
                <Skeleton className="h-3 w-32 mt-2 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const usuariosAtivos = usuarios.filter((u) => u.ativo === true || (u.ativo as any) === 1).length
  const usuariosAdmin = usuarios.filter((u) => u.tipo === "admin").length
  const usuariosTecnicos = usuarios.filter((u) => u.tipo === "tecnico").length

  const hasActiveFilterUsuarios = busca.trim() !== "" || tipoCardFilter !== "todos"

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        {logoMenu && <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />}
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Gestão de Usuários
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground">
            Gerencie usuários e controle de acesso ao sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card 
          onClick={() => setTipoCardFilter("todos")}
          className={cn(
            "bg-purple-950/20 border-purple-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-purple-950/30",
            tipoCardFilter === "todos" ? "ring-2 ring-purple-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-purple-400">Total de Usuários</CardTitle>
            <Users className="h-3 w-3 lg:h-5 lg:w-5 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-purple-200">{usuarios.length}</div>
            <p className="text-[10px] lg:text-xs text-purple-400/80 mt-0.5 lg:mt-1">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoCardFilter("ativo")}
          className={cn(
            "bg-green-950/20 border-green-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-green-950/30",
            tipoCardFilter === "ativo" ? "ring-2 ring-green-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-green-400">Usuários Ativos</CardTitle>
            <CheckCircle className="h-3 w-3 lg:h-5 lg:w-5 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-green-200">{usuariosAtivos}</div>
            <p className="text-[10px] lg:text-xs text-green-400/80 mt-0.5 lg:mt-1">com acesso liberado</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoCardFilter("admin")}
          className={cn(
            "bg-blue-950/20 border-blue-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-blue-950/30",
            tipoCardFilter === "admin" ? "ring-2 ring-blue-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-blue-400">Administradores</CardTitle>
            <Crown className="h-3 w-3 lg:h-5 lg:w-5 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-blue-200">{usuariosAdmin}</div>
            <p className="text-[10px] lg:text-xs text-blue-400/80 mt-0.5 lg:mt-1">com acesso total</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoCardFilter("tecnico")}
          className={cn(
            "bg-yellow-950/20 border-yellow-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-yellow-950/30",
            tipoCardFilter === "tecnico" ? "ring-2 ring-yellow-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-yellow-400">Técnicos</CardTitle>
            <Shield className="h-3 w-3 lg:h-5 lg:w-5 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-yellow-200">{usuariosTecnicos}</div>
            <p className="text-[10px] lg:text-xs text-yellow-400/80 mt-0.5 lg:mt-1">perfil técnico</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-950/60 via-pink-950/60 to-purple-950/60 text-white border-b border-border/40 rounded-t-lg p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-purple-400" />
              <div>
                <CardTitle className="text-foreground">Gestão de Usuários</CardTitle>
                <CardDescription className="text-muted-foreground">Gerencie usuários e permissões do sistema</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-muted/40 hover:bg-muted/60 text-foreground border-border"
                onClick={carregarUsuarios}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <NovoUsuarioDialog onUsuarioCriado={carregarUsuarios} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8 bg-background border-border text-foreground"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:block">
            <ResizableTable
              storageKey="usuarios"
              columns={[
                { key: "nome",          label: "Usuário",       width: 200, sortable: true },
                { key: "email",         label: "Email",         width: 200, sortable: true },
                { key: "tipo",          label: "Tipo",          width: 110, sortable: true },
                { key: "permissoes",    label: "Permissões",    width: 200, sortable: false },
                { key: "ativo",         label: "Status",        width: 100, sortable: true },
                { key: "ultimo_acesso", label: "Último Acesso", width: 160, sortable: true },
                { key: "acoes",         label: "Ações",         width: 160, sortable: false, noResize: true },
              ]}
              data={usuariosFiltrados}
              rowKey={(row) => row.id}
              emptyState={
                <div className="text-center py-8 text-muted-foreground">
                  {busca ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                </div>
              }
              renderCell={(usuario, col) => {
                switch (col) {
                  case "nome":
                    return (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="/placeholder.svg" alt={usuario.nome} />
                          <AvatarFallback className="bg-muted text-foreground">{usuario.nome.split(" ").map((n) => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-foreground">{usuario.nome}</span>
                          {usuario.telefone && <p className="text-xs text-muted-foreground">{usuario.telefone}</p>}
                        </div>
                      </div>
                    )
                  case "email": return <span className="truncate text-foreground">{usuario.email}</span>
                  case "tipo": return getTipoBadge(usuario.tipo)
                  case "permissoes": return getPermissoesBadges(usuario.permissoes)
                  case "ativo": return getStatusBadge(usuario.ativo)
                  case "ultimo_acesso": return <span className="text-sm text-muted-foreground">{formatarData(usuario.ultimo_acesso)}</span>
                  case "acoes":
                    return (
                      <div className="flex items-center gap-1">
                        {/* Desktop View: Show buttons directly on large screens */}
                        <div className="hidden xl:flex gap-2">
                          <Button variant="outline" size="sm" className="hover:bg-blue-950/40 text-foreground border-border bg-transparent" onClick={() => handleEditar(usuario)}>Editar</Button>
                          <Button variant="outline" size="sm" className="hover:bg-red-950/40 text-red-400 border-border bg-transparent" onClick={() => handleExcluir(usuario)}>Excluir</Button>
                        </div>
                        {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                        <div className="xl:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditar(usuario)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleExcluir(usuario)}>
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  default: return null
                }
              }}
            />
          </div>

          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3">
            {!hasActiveFilterUsuarios ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-base font-medium text-foreground mb-1">Busque ou filtre para ver os usuários</h3>
                <p className="text-sm text-muted-foreground">Digite na busca ou selecione um card de filtro para começar.</p>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-base font-medium text-foreground mb-1">Nenhum usuário encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
              </div>
            ) : (
              usuariosFiltrados.map((usuario) => {
                const isExpanded = expandedUsuarioId === usuario.id
                return (
                  <div
                    key={usuario.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden bg-card border-border ${
                      isExpanded ? "shadow-lg ring-1 ring-purple-900/50" : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedUsuarioId(prev => prev === usuario.id ? null : usuario.id)}
                      className="w-full text-left p-3.5 flex items-center gap-3"
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src="/placeholder.svg" alt={usuario.nome} />
                        <AvatarFallback className="bg-muted text-foreground">{usuario.nome.split(" ").map((n) => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-foreground break-words whitespace-normal leading-tight mt-1 block">
                          {usuario.nome}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {getTipoBadge(usuario.tipo)}
                          {getStatusBadge(usuario.ativo)}
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`} />
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Email</span>
                              <p className="text-xs text-foreground truncate">{usuario.email}</p>
                            </div>
                            {usuario.telefone && (
                              <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Telefone</span>
                                <p className="text-xs text-foreground">{usuario.telefone}</p>
                              </div>
                            )}
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5 col-span-2">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Permissões</span>
                              <div className="mt-1">{getPermissoesBadges(usuario.permissoes)}</div>
                            </div>
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5 col-span-2">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Último Acesso</span>
                              <p className="text-xs text-foreground">{formatarData(usuario.ultimo_acesso)}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs hover:bg-blue-950/40 border-border bg-card text-foreground" onClick={() => handleEditar(usuario)}>Editar</Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs hover:bg-red-950/40 text-red-400 border-border bg-card" onClick={() => handleExcluir(usuario)}>Excluir</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <EditarUsuarioDialog
        usuario={usuarioEditando}
        open={editarDialogOpen}
        onOpenChange={setEditarDialogOpen}
        onUsuarioAtualizado={carregarUsuarios}
      />

      <ExcluirUsuarioDialog
        usuario={usuarioExcluindo}
        open={excluirDialogOpen}
        onOpenChange={setExcluirDialogOpen}
        onUsuarioExcluido={carregarUsuarios}
      />
    </div>
  )
}
