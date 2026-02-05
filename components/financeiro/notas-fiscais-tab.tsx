"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Search,
  Plus,
  Eye,
  Trash2,
  Filter,
  Send,
  Loader2,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Download,
  Receipt,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { NovaNotaFiscalDialog } from "./nova-nota-fiscal-dialog"
import { GerarBoletosNFDialog } from "./gerar-boletos-nf-dialog"

interface NotaFiscal {
  id: number
  numero: string | null
  cliente_id: number
  cliente_nome: string
  cliente_cnpj: string | null
  cliente_cpf: string | null
  valor: number
  descricao_servico: string
  observacoes: string | null
  data_emissao: string | null
  data_competencia: string | null
  municipal_service_name: string | null
  iss_percentual: number
  status: string
  asaas_id: string | null
  asaas_status: string | null
  asaas_numero: string | null
  asaas_pdf_url: string | null
  asaas_xml_url: string | null
  asaas_error_message: string | null
  boleto_id: number | null
  created_at: string
}

interface NotasFiscaisTabProps {
  valoresOcultos: boolean
  formatarValor: (valor: number) => string
  onBoletosUpdated: () => void
}

export function NotasFiscaisTab({ valoresOcultos, formatarValor, onBoletosUpdated }: NotasFiscaisTabProps) {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchNotas, setSearchNotas] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showNovaNotaDialog, setShowNovaNotaDialog] = useState(false)
  const [showGerarBoletosDialog, setShowGerarBoletosDialog] = useState(false)
  const [notaParaBoletos, setNotaParaBoletos] = useState<NotaFiscal | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [notaParaExcluir, setNotaParaExcluir] = useState<NotaFiscal | null>(null)
  const [emitindoId, setEmitindoId] = useState<number | null>(null)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadNotas()
  }, [])

  const loadNotas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notas-fiscais")
      const result = await response.json()
      if (result.success) {
        setNotas(
          (result.data || []).map((n: any) => ({
            ...n,
            valor: typeof n.valor === "string" ? Number.parseFloat(n.valor) : n.valor,
          }))
        )
      }
    } catch (error) {
      console.error("Erro ao carregar notas fiscais:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmitirAsaas = async (nota: NotaFiscal) => {
    if (!confirm(`Emitir NFS-e para ${nota.cliente_nome} no valor de ${formatCurrency(nota.valor)} via Asaas?`)) {
      return
    }

    try {
      setEmitindoId(nota.id)
      const response = await fetch(`/api/notas-fiscais/${nota.id}/emitir`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Sucesso!", description: "NFS-e emitida com sucesso no Asaas!" })
        await loadNotas()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao emitir NFS-e", variant: "destructive" })
    } finally {
      setEmitindoId(null)
    }
  }

  const handleCancelar = async (nota: NotaFiscal) => {
    if (!confirm(`Cancelar a NFS-e de ${nota.cliente_nome}?`)) return

    try {
      setCancelandoId(nota.id)
      const response = await fetch(`/api/notas-fiscais/${nota.id}/cancelar`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Sucesso!", description: result.message })
        await loadNotas()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao cancelar NFS-e", variant: "destructive" })
    } finally {
      setCancelandoId(null)
    }
  }

  const handleGerarBoletos = (nota: NotaFiscal) => {
    setNotaParaBoletos(nota)
    setShowGerarBoletosDialog(true)
  }

  const handleExcluir = (nota: NotaFiscal) => {
    setNotaParaExcluir(nota)
    setShowDeleteDialog(true)
  }

  const confirmarExclusao = async () => {
    if (!notaParaExcluir) return
    try {
      setDeletingId(notaParaExcluir.id)
      const response = await fetch(`/api/notas-fiscais/${notaParaExcluir.id}`, { method: "DELETE" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Sucesso!", description: "Nota fiscal excluida" })
        await loadNotas()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir nota fiscal", variant: "destructive" })
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setNotaParaExcluir(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
      rascunho: {
        bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200",
        icon: <Clock className="w-3 h-3 mr-1" />, label: "Rascunho",
      },
      agendada: {
        bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200",
        icon: <Clock className="w-3 h-3 mr-1" />, label: "Agendada",
      },
      sincronizada: {
        bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200",
        icon: <Send className="w-3 h-3 mr-1" />, label: "Enviada",
      },
      autorizada: {
        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
        icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Autorizada",
      },
      processando_cancelamento: {
        bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
        icon: <AlertTriangle className="w-3 h-3 mr-1" />, label: "Cancelando...",
      },
      cancelada: {
        bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200",
        icon: <XCircle className="w-3 h-3 mr-1" />, label: "Cancelada",
      },
      cancelamento_negado: {
        bg: "bg-red-50", text: "text-red-700", border: "border-red-200",
        icon: <AlertCircle className="w-3 h-3 mr-1" />, label: "Cancel. Negado",
      },
      erro: {
        bg: "bg-red-50", text: "text-red-700", border: "border-red-200",
        icon: <AlertCircle className="w-3 h-3 mr-1" />, label: "Erro",
      },
    }

    const config = configs[status] || configs.rascunho
    return (
      <Badge className={`${config.bg} ${config.text} ${config.border} hover:${config.bg} font-medium px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const filteredNotas = notas.filter((nota) => {
    const matchesSearch =
      (nota.cliente_nome || "").toLowerCase().includes(searchNotas.toLowerCase()) ||
      (nota.descricao_servico || "").toLowerCase().includes(searchNotas.toLowerCase()) ||
      (nota.numero || "").toLowerCase().includes(searchNotas.toLowerCase()) ||
      (nota.asaas_numero || "").toLowerCase().includes(searchNotas.toLowerCase())

    const matchesStatus = statusFilter === "all" || nota.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: notas.length,
    rascunhos: notas.filter((n) => n.status === "rascunho").length,
    emitidas: notas.filter((n) => n.status === "autorizada").length,
    erros: notas.filter((n) => n.status === "erro").length,
    valorTotal: notas.reduce((acc, n) => acc + (typeof n.valor === "number" ? n.valor : 0), 0),
    valorEmitidas: notas
      .filter((n) => n.status === "autorizada")
      .reduce((acc, n) => acc + (typeof n.valor === "number" ? n.valor : 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Carregando notas fiscais...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notas Fiscais (NFS-e)</h2>
          <p className="text-gray-600">Emita e gerencie notas fiscais de servico via Asaas</p>
        </div>
        <Button
          onClick={() => setShowNovaNotaDialog(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg h-9 lg:h-12 text-sm lg:text-base"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota Fiscal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-orange-600 font-medium">Total NFS-e</p>
            <p className="text-2xl font-bold text-orange-800">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-medium">Emitidas</p>
            <p className="text-2xl font-bold text-emerald-800">{stats.emitidas}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">{formatarValor(stats.valorEmitidas)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-gray-50 to-slate-50">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 font-medium">Rascunhos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.rascunhos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs text-red-600 font-medium">Com Erro</p>
            <p className="text-2xl font-bold text-red-800">{stats.erros}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-white to-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notas fiscais..."
                value={searchNotas}
                onChange={(e) => setSearchNotas(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="sincronizada">Enviada</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="erro">Com Erro</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg p-4 lg:p-6">
          <CardTitle>Lista de Notas Fiscais</CardTitle>
          <CardDescription className="text-orange-100">
            {filteredNotas.length} nota{filteredNotas.length !== 1 ? "s" : ""} encontrada{filteredNotas.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchNotas || statusFilter !== "all" ? "Nenhuma nota encontrada" : "Nenhuma nota fiscal cadastrada"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchNotas || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Emita sua primeira nota fiscal de servico"}
              </p>
              {!searchNotas && statusFilter === "all" && (
                <Button
                  onClick={() => setShowNovaNotaDialog(true)}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Emitir Primeira NFS-e
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">NFS-e</TableHead>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Servico</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotas.map((nota) => (
                    <TableRow key={nota.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div>
                          <Badge variant="outline" className="font-mono text-xs">
                            {nota.asaas_numero || nota.numero || `#${nota.id}`}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{nota.cliente_nome}</div>
                        <div className="text-xs text-gray-500">{nota.cliente_cnpj || nota.cliente_cpf}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-gray-700">
                          {nota.descricao_servico}
                        </div>
                        {nota.municipal_service_name && (
                          <div className="text-xs text-gray-500 truncate">{nota.municipal_service_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-orange-600">{formatarValor(nota.valor)}</div>
                        {nota.iss_percentual > 0 && (
                          <div className="text-xs text-gray-500">ISS: {nota.iss_percentual}%</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{nota.data_emissao ? formatDate(nota.data_emissao) : "-"}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(nota.status)}
                        {nota.status === "erro" && nota.asaas_error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={nota.asaas_error_message}>
                            {nota.asaas_error_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {/* Emitir no Asaas - rascunho ou erro */}
                          {(nota.status === "rascunho" || nota.status === "erro") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEmitirAsaas(nota)}
                              disabled={emitindoId === nota.id}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent h-8"
                              title="Emitir NFS-e no Asaas"
                            >
                              {emitindoId === nota.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}

                          {/* Gerar boletos - qualquer status exceto cancelada */}
                          {nota.status !== "cancelada" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGerarBoletos(nota)}
                              className="border-green-300 text-green-600 hover:bg-green-50 bg-transparent h-8"
                              title="Gerar boletos"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Download PDF */}
                          {nota.asaas_pdf_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(nota.asaas_pdf_url!, "_blank")}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent h-8"
                              title="Baixar PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Download XML */}
                          {nota.asaas_xml_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(nota.asaas_xml_url!, "_blank")}
                              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 bg-transparent h-8"
                              title="Baixar XML"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Cancelar - agendada, sincronizada ou autorizada */}
                          {["agendada", "sincronizada", "autorizada"].includes(nota.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelar(nota)}
                              disabled={cancelandoId === nota.id}
                              className="border-amber-300 text-amber-600 hover:bg-amber-50 bg-transparent h-8"
                              title="Cancelar NFS-e"
                            >
                              {cancelandoId === nota.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}

                          {/* Excluir - apenas rascunho ou erro */}
                          {(nota.status === "rascunho" || nota.status === "erro") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExcluir(nota)}
                              disabled={deletingId === nota.id}
                              className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent h-8"
                              title="Excluir nota"
                            >
                              {deletingId === nota.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NovaNotaFiscalDialog
        open={showNovaNotaDialog}
        onOpenChange={setShowNovaNotaDialog}
        onSuccess={() => { loadNotas(); onBoletosUpdated() }}
      />

      <GerarBoletosNFDialog
        open={showGerarBoletosDialog}
        onOpenChange={setShowGerarBoletosDialog}
        notaFiscal={notaParaBoletos ? {
          id: notaParaBoletos.id,
          valor: notaParaBoletos.valor,
          cliente_nome: notaParaBoletos.cliente_nome,
          descricao_servico: notaParaBoletos.descricao_servico,
        } : null}
        onSuccess={() => { loadNotas(); onBoletosUpdated() }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Confirmar Exclusao
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base">
              Tem certeza que deseja excluir esta nota fiscal?
              <br />
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-gray-200 hover:bg-gray-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700 shadow-lg"
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
