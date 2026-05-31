"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, FileText, Edit, Eye, Trash2, Printer, Filter, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DocumentoPrint } from "@/components/documento-print"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface Documento {
  id: number
  codigo: string
  titulo: string
  conteudo: string
  cliente_id: number
  cliente_nome: string
  cliente_endereco: string
  cliente_telefone: string
  cliente_email: string
  tipo_documento: string
  status: string
  versao: number
  tags: string
  created_at: string
  updated_at: string
  created_by: string
  observacoes: string
}

export default function DocumentosPage() {
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tipoFilter, setTipoFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocumentos, setTotalDocumentos] = useState(0)
  const [documentoParaImprimir, setDocumentoParaImprimir] = useState<Documento | null>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const itemsPerPage = 10

  useEffect(() => {
    fetchDocumentos()
  }, [currentPage, searchTerm, statusFilter, tipoFilter])

  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter,
        tipo: tipoFilter,
      })

      const response = await fetch(`/api/documentos?${params}`)
      const data = await response.json()

      if (data.success) {
        setDocumentos(data.data)
        setTotalPages(data.totalPages)
        setTotalDocumentos(data.total)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar documentos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documento: Documento) => {
    try {
      const response = await fetch(`/api/documentos/${documento.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Documento excluído com sucesso",
        })
        fetchDocumentos()
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao excluir documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir documento",
        variant: "destructive",
      })
    }
  }

  const handlePrint = (documento: Documento) => {
    setDocumentoParaImprimir(documento)
    setShowPrintDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      rascunho: {
        label: "Rascunho",
        variant: "secondary" as const,
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      },
      finalizado: {
        label: "Finalizado",
        variant: "default" as const,
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      },
      assinado: {
        label: "Assinado",
        variant: "default" as const,
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      },
      arquivado: {
        label: "Arquivado",
        variant: "outline" as const,
        color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    }

    return <Badge className={`${config.color} font-medium border`}>{config.label}</Badge>
  }

  const getTipoIcon = (tipo: string) => {
    const icons = {
      contrato: "📄",
      proposta: "📋",
      orcamento: "💰",
      relatorio: "📊",
      carta: "✉️",
      outros: "📝",
    }
    return icons[tipo as keyof typeof icons] || "📄"
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchDocumentos()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="space-y-8 p-6">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-blue-900/40 p-8 text-white shadow-xl border border-border/30">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Documentos</h1>
              <p className="mt-2 text-blue-100 dark:text-gray-300 text-lg">Gerencie seus documentos e contratos de forma inteligente</p>
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>{totalDocumentos} documentos</span>
                </div>
              </div>
            </div>
            <Link href="/documentos/novo">
              <Button
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm shadow-lg hover:scale-105 transition-all duration-200 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
              >
                <Plus className="mr-2 h-5 w-5" />
                Novo Documento
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros com design moderno */}
        <Card className="shadow-lg border border-border bg-card text-card-foreground">
          <CardHeader className="p-4 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <Input
                  placeholder="🔍 Buscar por título, código ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 text-base border border-border bg-background text-foreground focus:border-blue-500 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 border border-border bg-background text-foreground rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="rascunho">📝 Rascunho</SelectItem>
                  <SelectItem value="finalizado">✅ Finalizado</SelectItem>
                  <SelectItem value="assinado">🔏 Assinado</SelectItem>
                  <SelectItem value="arquivado">📁 Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-48 h-12 border border-border bg-background text-foreground rounded-xl">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="contrato">📄 Contrato</SelectItem>
                  <SelectItem value="proposta">📋 Proposta</SelectItem>
                  <SelectItem value="orcamento">💰 Orçamento</SelectItem>
                  <SelectItem value="relatorio">📊 Relatório</SelectItem>
                  <SelectItem value="carta">✉️ Carta</SelectItem>
                  <SelectItem value="outros">📝 Outros</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Search className="mr-2 h-5 w-5" />
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <Card className="shadow-lg border border-border bg-card text-card-foreground">
          <CardHeader className="p-4 border-b border-border/40">
            <CardTitle className="text-xl text-foreground">
              📚 Documentos ({totalDocumentos} {totalDocumentos === 1 ? "documento" : "documentos"})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 p-6 border border-border rounded-xl bg-muted/20"
                  >
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-200/20 to-purple-200/20 animate-pulse rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gradient-to-r from-gray-200/20 to-blue-200/20 animate-pulse rounded-lg w-1/3" />
                      <div className="h-4 bg-gradient-to-r from-gray-200/20 to-purple-200/20 animate-pulse rounded-lg w-1/2" />
                    </div>
                    <div className="h-10 w-24 bg-gradient-to-r from-blue-200/20 to-purple-200/20 animate-pulse rounded-lg" />
                  </div>
                ))}
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-950/20 dark:to-purple-950/20 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground mb-8">Comece criando um novo documento para organizar seus arquivos.</p>
                <Link href="/documentos/novo">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Criar Primeiro Documento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {documentos.map((documento) => (
                  <div
                    key={documento.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border border-border rounded-xl hover:border-blue-500/50 bg-card hover:bg-muted/10 transition-all duration-300 hover:shadow-md hover:scale-[1.01] gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                          {getTipoIcon(documento.tipo_documento)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground break-words">{documento.titulo}</h3>
                          {getStatusBadge(documento.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6 text-xs sm:text-sm text-muted-foreground">
                          <span className="font-medium whitespace-nowrap">📋 {documento.codigo}</span>
                          <span className="whitespace-nowrap">🔄 v{documento.versao}</span>
                          <span className="whitespace-nowrap">📁 {documento.tipo_documento}</span>
                          {documento.cliente_nome && <span className="break-all">👤 {documento.cliente_nome}</span>}
                          <span className="whitespace-nowrap">📅 {format(new Date(documento.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Desktop View: Show buttons directly on large screens */}
                      <div className="hidden xl:flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrint(documento)}
                          className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-muted-foreground rounded-lg"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Link href={`/documentos/${documento.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 text-muted-foreground rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/documentos/${documento.id}/editar`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:bg-yellow-950/40 dark:hover:text-yellow-400 text-muted-foreground rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-muted-foreground rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o documento "{documento.titulo}"? Esta ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(documento)}
                                className="bg-red-600 hover:bg-red-700 rounded-lg text-white"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                      <div className="xl:hidden">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem onClick={() => handlePrint(documento)} className="cursor-pointer">
                                <Printer className="mr-2 h-4 w-4 text-blue-500" />
                                <span>Imprimir</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/documentos/${documento.id}`}>
                                  <Eye className="mr-2 h-4 w-4 text-emerald-500" />
                                  <span>Visualizar</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/documentos/${documento.id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4 text-yellow-500" />
                                  <span>Editar</span>
                                </Link>
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o documento "{documento.titulo}"? Esta ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(documento)}
                                className="bg-red-600 hover:bg-red-700 rounded-lg text-white"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação moderna */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 p-4 bg-muted/40 rounded-xl border border-border">
                <div className="text-sm text-muted-foreground font-medium">
                  📄 Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border hover:bg-muted/60"
                  >
                    ← Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border hover:bg-muted/60"
                  >
                    Próxima →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Impressão */}
        <DocumentoPrint
          documento={documentoParaImprimir}
          isOpen={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false)
            setDocumentoParaImprimir(null)
          }}
        />
      </div>
    </div>
  )
}
