"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCog, Search, Shield, User, Users, CheckCircle, XCircle, Crown, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { NovoUsuarioDialog } from "@/components/usuarios/novo-usuario-dialog"
import { EditarUsuarioDialog } from "@/components/usuarios/editar-usuario-dialog"
import { ExcluirUsuarioDialog } from "@/components/usuarios/excluir-usuario-dialog"
import type { Usuario } from "@/types/usuario"

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([])
  const [busca, setBusca] = useState("")
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
    if (busca.trim() === "") {
      setUsuariosFiltrados(usuarios)
    } else {
      const filtrados = usuarios.filter(
        (usuario) =>
          usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
          usuario.email.toLowerCase().includes(busca.toLowerCase()),
      )
      setUsuariosFiltrados(filtrados)
    }
  }, [busca, usuarios])

  const getStatusBadge = (ativo: number) => {
    if (ativo === 1) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
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
          <Badge className="bg-purple-100 text-purple-800">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case "tecnico":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Shield className="w-3 h-3 mr-1" />
            Técnico
          </Badge>
        )
      case "usuario":
        return (
          <Badge className="bg-green-100 text-green-800">
            <User className="w-3 h-3 mr-1" />
            Usuário
          </Badge>
        )
      case "vendedor":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
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
        <Badge variant="outline" className="text-xs">
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
          <Badge key={permissao} variant="outline" className="text-xs">
            {permissoesLabels[permissao] || permissao}
          </Badge>
        ))}
        {permissoesArray.length > 3 && (
          <Badge variant="outline" className="text-xs">
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
      return new Date(data).toLocaleString("pt-BR")
    } catch {
      return "-"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-purple-50/30">
        <div className="flex items-center gap-3 mb-6">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const usuariosAtivos = usuarios.filter((u) => u.ativo === 1).length
  const usuariosAdmin = usuarios.filter((u) => u.tipo === "admin").length
  const usuariosTecnicos = usuarios.filter((u) => u.tipo === "tecnico").length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-purple-50/30">
      <div className="flex items-center gap-3 mb-6">
        {logoMenu && <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />}
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestão de Usuários
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground">
            Gerencie usuários e controle de acesso ao sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-purple-700">Total de Usuários</CardTitle>
            <Users className="h-3 w-3 lg:h-5 lg:w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-purple-800">{usuarios.length}</div>
            <p className="text-[10px] lg:text-xs text-purple-600 mt-0.5 lg:mt-1">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-green-700">Usuários Ativos</CardTitle>
            <CheckCircle className="h-3 w-3 lg:h-5 lg:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-green-800">{usuariosAtivos}</div>
            <p className="text-[10px] lg:text-xs text-green-600 mt-0.5 lg:mt-1">com acesso liberado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-blue-700">Administradores</CardTitle>
            <Crown className="h-3 w-3 lg:h-5 lg:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-blue-800">{usuariosAdmin}</div>
            <p className="text-[10px] lg:text-xs text-blue-600 mt-0.5 lg:mt-1">com acesso total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-yellow-700">Técnicos</CardTitle>
            <Shield className="h-3 w-3 lg:h-5 lg:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-yellow-800">{usuariosTecnicos}</div>
            <p className="text-[10px] lg:text-xs text-yellow-600 mt-0.5 lg:mt-1">perfil técnico</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              <div>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription className="text-purple-100">Gerencie usuários e permissões do sistema</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
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
                className="pl-8"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {busca ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt={usuario.nome} />
                            <AvatarFallback>
                              {usuario.nome
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{usuario.nome}</span>
                            {usuario.telefone && <p className="text-xs text-muted-foreground">{usuario.telefone}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{getTipoBadge(usuario.tipo)}</TableCell>
                      <TableCell>{getPermissoesBadges(usuario.permissoes)}</TableCell>
                      <TableCell>{getStatusBadge(usuario.ativo)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatarData(usuario.ultimo_acesso)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50 bg-transparent"
                            onClick={() => handleEditar(usuario)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 text-red-600 bg-transparent"
                            onClick={() => handleExcluir(usuario)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
