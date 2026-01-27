"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Eye,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  X,
  Printer,
  Download,
  CreditCard,
} from "lucide-react"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: "pendente" | "pago" | "vencido" | "cancelado"
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
  created_at: string
  charge_id?: string // Renomeado de pagseguro_id para charge_id
  linha_digitavel?: string
  codigo_barras?: string
  link_pdf?: string
  link_impressao?: string
}

interface VisualizarBoletosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  numeroBase: string
}

export function VisualizarBoletosDialog({ open, onOpenChange, numeroBase }: VisualizarBoletosDialogProps) {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(false)
  const [printingAll, setPrintingAll] = useState(false)

  const extrairNumeroBase = (numero: string): string => {
    return numero.replace(/-\d+$/, "")
  }

  useEffect(() => {
    if (open && numeroBase) {
      loadBoletos()
    }
  }, [open, numeroBase])

  const loadBoletos = async () => {
    try {
      setLoading(true)

      const numeroBaseLimpo = extrairNumeroBase(numeroBase)

      const response = await fetch(`/api/boletos?numeroBase=${encodeURIComponent(numeroBaseLimpo)}`)
      const result = await response.json()

      if (result.success) {
        const boletosProcessados = result.data
          .map((boleto: any) => ({
            ...boleto,
            valor: typeof boleto.valor === "string" ? Number.parseFloat(boleto.valor) : boleto.valor,
            cliente_id: typeof boleto.cliente_id === "string" ? Number.parseInt(boleto.cliente_id) : boleto.cliente_id,
            numero_parcela:
              typeof boleto.numero_parcela === "string"
                ? Number.parseInt(boleto.numero_parcela)
                : boleto.numero_parcela,
            total_parcelas:
              typeof boleto.total_parcelas === "string"
                ? Number.parseInt(boleto.total_parcelas)
                : boleto.total_parcelas,
          }))
          .sort((a: Boleto, b: Boleto) => a.numero_parcela - b.numero_parcela)

        setBoletos(boletosProcessados)
      }
    } catch (error) {
      console.error("Erro ao carregar boletos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, dataVencimento?: string) => {
    const hoje = new Date()
    const vencimento = dataVencimento ? new Date(dataVencimento) : null

    if (vencimento) {
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
    }

    const isVencido = status === "pendente" && vencimento && vencimento < hoje

    if (status === "pago") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium px-3 py-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      )
    }

    if (status === "cancelado") {
      return (
        <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium px-3 py-1">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      )
    }

    if (isVencido || status === "vencido") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-medium px-3 py-1 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>
      )
    }

    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium px-3 py-1">
        <Clock className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  const calcularResumo = () => {
    const total = boletos.length
    const pagos = boletos.filter((b) => b.status === "pago").length
    const pendentes = boletos.filter((b) => b.status === "pendente").length
    const vencidos = boletos.filter((b) => {
      const hoje = new Date()
      const vencimento = new Date(b.data_vencimento)
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return (b.status === "pendente" && vencimento < hoje) || b.status === "vencido"
    }).length
    const cancelados = boletos.filter((b) => b.status === "cancelado").length

    const valorTotal = boletos.reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0)
    const valorPago = boletos
      .filter((b) => b.status === "pago")
      .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0)
    const valorPendente = boletos
      .filter((b) => b.status === "pendente")
      .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0)

    return { total, pagos, pendentes, vencidos, cancelados, valorTotal, valorPago, valorPendente }
  }

  const resumo = calcularResumo()
  const clienteNome = boletos.length > 0 ? boletos[0].cliente_nome : ""
  const numeroBaseLimpo = extrairNumeroBase(numeroBase)

  const copiarLinhaDigitavel = (linhaDigitavel: string) => {
    navigator.clipboard.writeText(linhaDigitavel)
    alert("Linha digitável copiada para a área de transferência!")
  }

  const abrirPDF = (url: string) => {
    window.open(url, "_blank")
  }

  const imprimirTodosBoletos = () => {
    setPrintingAll(true)

    const boletosComPDF = boletos.filter((b) => b.link_pdf || b.link_impressao)

    if (boletosComPDF.length === 0) {
      alert("Nenhum boleto disponível para impressão.")
      setPrintingAll(false)
      return
    }

    boletosComPDF.forEach((boleto, index) => {
      setTimeout(() => {
        const url = boleto.link_pdf || boleto.link_impressao
        if (url) {
          window.open(url, "_blank")
        }
      }, index * 500) // Delay de 500ms entre cada abertura
    })

    setTimeout(
      () => {
        setPrintingAll(false)
      },
      boletosComPDF.length * 500 + 1000,
    )
  }

  const baixarTodosPDFs = async () => {
    const boletosComPDF = boletos.filter((b) => b.link_pdf)

    if (boletosComPDF.length === 0) {
      alert("Nenhum PDF disponível para download.")
      return
    }

    for (const boleto of boletosComPDF) {
      try {
        const response = await fetch(boleto.link_pdf!)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `boleto-${boleto.numero}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Delay entre downloads
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Erro ao baixar boleto ${boleto.numero}:`, error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white -m-6 mb-6 p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Eye className="h-5 w-5" />
            </div>
            Visualizar Boletos - Nota {numeroBaseLimpo}
          </DialogTitle>
          <DialogDescription className="text-blue-100">
            {clienteNome && `Cliente: ${clienteNome}`}
            {boletos.length > 0 && ` • ${boletos.length} parcela${boletos.length > 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando boletos...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-blue-800">{resumo.total}</div>
                  <p className="text-xs text-blue-600">{formatCurrency(resumo.valorTotal)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-green-800">{resumo.pagos}</div>
                  <p className="text-xs text-green-600">{formatCurrency(resumo.valorPago)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-yellow-800">{resumo.pendentes}</div>
                  <p className="text-xs text-yellow-600">{formatCurrency(resumo.valorPendente)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Vencidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-red-800">{resumo.vencidos}</div>
                  <p className="text-xs text-red-600">Requer atenção</p>
                </CardContent>
              </Card>
            </div>

            {boletos.some((b) => b.link_pdf || b.link_impressao) && (
              <div className="flex gap-3 justify-end bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <Button
                  onClick={baixarTodosPDFs}
                  disabled={!boletos.some((b) => b.link_pdf)}
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300 shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Todos PDFs
                </Button>
                <Button
                  onClick={imprimirTodosBoletos}
                  disabled={printingAll}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                >
                  {printingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Abrindo...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Todos
                    </>
                  )}
                </Button>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lista de Parcelas - Nota {numeroBaseLimpo}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {boletos.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum boleto encontrado para esta nota</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Número Boleto</TableHead>
                          <TableHead className="font-semibold">Parcela</TableHead>
                          <TableHead className="font-semibold">Valor</TableHead>
                          <TableHead className="font-semibold">Vencimento</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Data Pagamento</TableHead>
                          <TableHead className="font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {boletos.map((boleto) => (
                          <TableRow key={boleto.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">
                              <Badge variant="outline" className="font-mono">
                                {boleto.numero}
                              </Badge>
                              {boleto.charge_id && (
                                <Badge variant="secondary" className="ml-2 bg-teal-100 text-teal-700">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Asaas
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono">
                                {boleto.numero_parcela}/{boleto.total_parcelas}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-green-600">{formatCurrency(boleto.valor)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(boleto.data_vencimento)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(boleto.status, boleto.data_vencimento)}</TableCell>
                            <TableCell>
                              {boleto.data_pagamento ? (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>{formatDate(boleto.data_pagamento)}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                {boleto.linha_digitavel && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copiarLinhaDigitavel(boleto.linha_digitavel!)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 w-full justify-start"
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Copiar Linha Digitável
                                  </Button>
                                )}
                                {boleto.link_pdf && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirPDF(boleto.link_pdf!)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 w-full justify-start"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar PDF
                                  </Button>
                                )}
                                {boleto.link_impressao && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirPDF(boleto.link_impressao!)}
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 w-full justify-start"
                                  >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir Boleto
                                  </Button>
                                )}
                                {!boleto.charge_id && <span className="text-xs text-gray-500">Boleto interno</span>}
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

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="border-gray-200 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
