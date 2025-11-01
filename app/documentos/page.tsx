"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, FileText, Edit, Eye, Trash2, Printer, Filter } from "lucide-react"
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
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      finalizado: {
        label: "Finalizado",
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      assinado: {
        label: "Assinado",
        variant: "default" as const,
        color: "bg-green-100 text-green-800 border-green-200",
      },
      arquivado: {
        label: "Arquivado",
        variant: "outline" as const,
        color: "bg-gray-100 text-gray-800 border-gray-200",
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      color: "bg-gray-100 text-gray-800 border-gray-200",
    }

    return <Badge className={`${config.color} font-medium`}>{config.label}</Badge>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="space-y-8 p-6">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Documentos</h1>
              <p className="mt-2 text-blue-100 text-lg">Gerencie seus documentos e contratos de forma inteligente</p>
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
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Plus className="mr-2 h-5 w-5" />
                Novo Documento
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros com design moderno */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Filter className="h-5 w-5 text-blue-600" />
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
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 border-2 border-gray-200 rounded-xl">
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
                <SelectTrigger className="w-48 h-12 border-2 border-gray-200 rounded-xl">
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
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg p-4 lg:p-6">
            <CardTitle className="text-xl text-gray-800">
              📚 Documentos ({totalDocumentos} {totalDocumentos === 1 ? "documento" : "documentos"})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 p-6 border-2 border-gray-100 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50"
                  >
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-200 to-purple-200 animate-pulse rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-blue-200 animate-pulse rounded-lg w-1/3" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-purple-200 animate-pulse rounded-lg w-1/2" />
                    </div>
                    <div className="h-10 w-24 bg-gradient-to-r from-blue-200 to-purple-200 animate-pulse rounded-lg" />
                  </div>
                ))}
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
                <p className="text-gray-500 mb-8">Comece criando um novo documento para organizar seus arquivos.</p>
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
                    className="group flex items-center justify-between p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 bg-gradient-to-r from-white to-blue-50/30 hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                          {getTipoIcon(documento.tipo_documento)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{documento.titulo}</h3>
                          {getStatusBadge(documento.status)}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span className="font-medium">📋 {documento.codigo}</span>
                          <span>🔄 v{documento.versao}</span>
                          <span>📁 {documento.tipo_documento}</span>
                          {documento.cliente_nome && <span>👤 {documento.cliente_nome}</span>}
                          <span>📅 {format(new Date(documento.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(documento)}
                        className="hover:bg-blue-100 hover:text-blue-700 rounded-lg"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Link href={`/documentos/${documento.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-green-100 hover:text-green-700 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/documentos/${documento.id}/editar`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-yellow-100 hover:text-yellow-700 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-red-100 hover:text-red-700 rounded-lg">
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
                              className="bg-red-600 hover:bg-red-700 rounded-lg"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação moderna */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                <div className="text-sm text-gray-600 font-medium">
                  📄 Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border-2 hover:bg-blue-50 hover:border-blue-300"
                  >
                    ← Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border-2 hover:bg-blue-50 hover:border-blue-300"
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
