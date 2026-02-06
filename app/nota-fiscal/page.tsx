"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Plus,
  Search,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  FileCheck,
  DollarSign,
  Send,
  RefreshCw,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { DetalheNfseDialog } from "@/components/nfse/detalhe-nfse-dialog"
import Link from "next/link"

interface NotaFiscal {
  id: number
  numero_nfse: string | null
  numero_rps: number
  serie_rps: string
  codigo_verificacao: string | null
  origem: string
  origem_id: number | null
  origem_numero: string | null
  tomador_razao_social: string
  tomador_cpf_cnpj: string
  valor_servicos: number
  valor_total: number
  status: string
  data_emissao: string | null
  created_at: string
  cliente_nome: string | null
  mensagem_erro: string | null
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

export default function NotaFiscalPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [origemFilter, setOrigemFilter] = useState("todos")
  const [emitirOpen, setEmitirOpen] = useState(false)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [notaSelecionada, setNotaSelecionada] = useState<number | null>(null)
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [notaCancelar, setNotaCancelar] = useState<NotaFiscal | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")
  const [cancelando, setCancelando] = useState(false)
  const [consultandoId, setConsultandoId] = useState<number | null>(null)
  const [logoMenu, setLogoMenu] = useState<string>("")

  const { toast } = useToast()

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    emitidas: 0,
    pendentes: 0,
    canceladas: 0,
    erros: 0,
    valorTotal: 0,
  })

  useEffect(() => {
    fetchNotas()
    loadLogoMenu()
  }, [])

  useEffect(() => {
    calcularStats()
  }, [notas])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error)
    }
  }

  const fetchNotas = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "todos") params.set("status", statusFilter)
      if (origemFilter !== "todos") params.set("origem", origemFilter)
      if (searchTerm) params.set("search", searchTerm)

      const response = await fetch(`/api/nfse?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setNotas(result.data || [])
      } else {
        // Se der erro (tabelas não existem), mostrar lista vazia
        setNotas([])
      }
    } catch {
      setNotas([])
    } finally {
      setLoading(false)
    }
  }

  const calcularStats = () => {
    const emitidas = notas.filter((n) => n.status === "emitida")
    setStats({
      total: notas.length,
      emitidas: emitidas.length,
      pendentes: notas.filter((n) => n.status === "pendente" || n.status === "processando").length,
      canceladas: notas.filter((n) => n.status === "cancelada").length,
      erros: notas.filter((n) => n.status === "erro").length,
      valorTotal: emitidas.reduce((sum, n) => sum + Number(n.valor_total), 0),
    })
  }

  const handleConsultar = async (notaId: number) => {
    setConsultandoId(notaId)
    try {
      const response = await fetch(`/api/nfse/${notaId}/consultar`, {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "NFS-e Encontrada!",
          description: result.message,
        })
        fetchNotas()
      } else {
        toast({
          title: "Consulta NFS-e",
          description: result.message,
          variant: result.data?.status === "processando" ? "default" : "destructive",
        })
        // Se houve mudanca de status, atualizar lista
        if (result.data?.status === "erro") {
          fetchNotas()
        }
      }
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao consultar status da NFS-e na prefeitura",
        variant: "destructive",
      })
    } finally {
      setConsultandoId(null)
    }
  }

  const handleConsultarTodas = async () => {
    const processando = notas.filter((n) => n.status === "processando")
    if (processando.length === 0) {
      toast({ title: "Nenhuma nota pendente", description: "Nao ha notas em processamento para consultar." })
      return
    }

    toast({ title: "Consultando...", description: `Consultando ${processando.length} nota(s) na prefeitura...` })

    for (const nota of processando) {
      await handleConsultar(nota.id)
      // Pequeno delay entre consultas para nao sobrecarregar
      await new Promise((r) => setTimeout(r, 1000))
    }

    fetchNotas()
  }

  const handleCancelar = async () => {
    if (!notaCancelar) return
    setCancelando(true)
    try {
      const response = await fetch(`/api/nfse/${notaCancelar.id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoCancelamento }),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: "NFS-e cancelada", description: "Nota fiscal cancelada com sucesso" })
        fetchNotas()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao cancelar nota fiscal", variant: "destructive" })
    } finally {
      setCancelando(false)
      setCancelarOpen(false)
      setNotaCancelar(null)
      setMotivoCancelamento("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "emitida":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Emitida
          </Badge>
        )
      case "processando":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
          </Badge>
        )
      case "pendente":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        )
      case "erro":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
            <AlertCircle className="h-3 w-3" />
            Erro
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getOrigemLabel = (origem: string) => {
    switch (origem) {
      case "orcamento":
        return "Orcamento"
      case "ordem_servico":
        return "O.S."
      case "boleto":
        return "Boleto"
      case "avulsa":
        return "Avulsa"
      default:
        return origem
    }
  }

  const notasFiltradas = notas.filter((nota) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchSearch =
        nota.numero_nfse?.toLowerCase().includes(search) ||
        nota.tomador_razao_social?.toLowerCase().includes(search) ||
        nota.cliente_nome?.toLowerCase().includes(search) ||
        String(nota.numero_rps).includes(search) ||
        nota.tomador_cpf_cnpj?.includes(search)
      if (!matchSearch) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6 pb-32 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Notas Fiscais
              </h1>
              <p className="text-gray-600 mt-1">Emissao e gerenciamento de NFS-e</p>
            </div>
          </div>
          <Button
            onClick={() => setEmitirOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Emitir NFS-e</span>
            <span className="md:hidden">Nova</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.emitidas}</p>
                  <p className="text-xs text-gray-500">Emitidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{stats.pendentes}</p>
                  <p className="text-xs text-gray-500">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.erros}</p>
                  <p className="text-xs text-gray-500">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.valorTotal)}</p>
                  <p className="text-xs text-gray-500">Valor Emitido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Tabela */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Notas Fiscais Emitidas
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats.pendentes > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConsultarTodas}
                    disabled={consultandoId !== null}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    {consultandoId !== null ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Consultar Pendentes ({stats.pendentes})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchNotas() }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por numero, nome, CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setTimeout(fetchNotas, 100) }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={origemFilter} onValueChange={(v) => { setOrigemFilter(v); setTimeout(fetchNotas, 100) }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Origens</SelectItem>
                  <SelectItem value="orcamento">Orcamento</SelectItem>
                  <SelectItem value="ordem_servico">O.S.</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="avulsa">Avulsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : notasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Nenhuma nota fiscal encontrada</h3>
                <p className="text-gray-500 mt-1">
                  Clique em "Emitir NFS-e" para emitir sua primeira nota fiscal de servico.
                </p>
                <Button
                  onClick={() => setEmitirOpen(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Emitir NFS-e
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NFS-e / RPS</TableHead>
                      <TableHead>Tomador</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notasFiltradas.map((nota) => (
                      <TableRow key={nota.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            {nota.numero_nfse ? (
                              <span className="font-semibold text-emerald-700">
                                NFS-e {String(nota.numero_nfse).padStart(8, "0")}
                              </span>
                            ) : nota.status === "processando" ? (
                              <button
                                className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1"
                                onClick={() => handleConsultar(nota.id)}
                                disabled={consultandoId === nota.id}
                              >
                                {consultandoId === nota.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                Consultar na prefeitura
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs italic">-</span>
                            )}
                            <p className="text-xs text-gray-400">RPS: {nota.serie_rps || "11"}.{String(nota.numero_rps).padStart(8, "0")}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {nota.tomador_razao_social || nota.cliente_nome}
                            </p>
                            <p className="text-xs text-gray-400">{nota.tomador_cpf_cnpj}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getOrigemLabel(nota.origem)}
                            {nota.origem_numero && ` #${nota.origem_numero}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(nota.valor_total)}
                        </TableCell>
                        <TableCell>{getStatusBadge(nota.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDateBR(nota.data_emissao || nota.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {nota.status === "processando" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleConsultar(nota.id)}
                                disabled={consultandoId === nota.id}
                                title="Consultar status na prefeitura"
                              >
                                {consultandoId === nota.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setNotaSelecionada(nota.id)
                                setDetalheOpen(true)
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {nota.status === "emitida" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setNotaCancelar(nota)
                                  setCancelarOpen(true)
                                }}
                                title="Cancelar NFS-e"
                              >
                                <XCircle className="h-4 w-4" />
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

        {/* Info sobre credenciamento */}
        <Card className="border-0 shadow-md bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Credenciamento na Prefeitura de Sao Paulo</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Para emitir notas em producao, voce precisa solicitar acesso ao Web Service da NFS-e
                  no portal da Prefeitura de SP e cadastrar o IP do seu servidor.
                  Configure o certificado digital e os dados fiscais em{" "}
                  <Link href="/configuracoes" className="underline font-medium">
                    Configuracoes &gt; NFS-e
                  </Link>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EmitirNfseDialog
        open={emitirOpen}
        onOpenChange={setEmitirOpen}
        onSuccess={() => fetchNotas()}
      />

      <DetalheNfseDialog
        open={detalheOpen}
        onOpenChange={setDetalheOpen}
        notaId={notaSelecionada}
      />

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar NFS-e</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a NFS-e{" "}
              {notaCancelar?.numero_nfse || `RPS ${notaCancelar?.numero_rps}`}?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Motivo do Cancelamento</label>
            <Textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Informe o motivo do cancelamento"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={cancelando || !motivoCancelamento}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
