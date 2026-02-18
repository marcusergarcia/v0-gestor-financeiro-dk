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
  ExternalLink,
} from "lucide-react"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: "pendente" | "aguardando_pagamento" | "pago" | "vencido" | "cancelado"
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
  created_at: string
  // Campos do Asaas
  asaas_id?: string
  asaas_customer_id?: string
  asaas_invoice_url?: string
  asaas_bankslip_url?: string
  asaas_barcode?: string
  asaas_linha_digitavel?: string
  asaas_nosso_numero?: string
  gateway?: string
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

  const isVencido = (status === "pendente" || status === "aguardando_pagamento") && vencimento && vencimento < hoje

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

  if (status === "aguardando_pagamento") {
  return (
  <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium px-3 py-1">
  <Clock className="w-3 h-3 mr-1" />
  Aguardando
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
  const pendentes = boletos.filter((b) => b.status === "pendente" || b.status === "aguardando_pagamento").length
  const vencidos = boletos.filter((b) => {
  const hoje = new Date()
  const vencimento = new Date(b.data_vencimento)
  hoje.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)
  return ((b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento < hoje) || b.status === "vencido"
  }).length
  const cancelados = boletos.filter((b) => b.status === "cancelado").length

  const valorTotal = boletos.reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0)
  const valorPago = boletos
  .filter((b) => b.status === "pago")
  .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0)
  const valorPendente = boletos
  .filter((b) => b.status === "pendente" || b.status === "aguardando_pagamento")
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

    const boletosComPDF = boletos.filter((b) => b.asaas_bankslip_url || b.asaas_invoice_url)

    if (boletosComPDF.length === 0) {
      alert("Nenhum boleto disponivel para impressao.")
      setPrintingAll(false)
      return
    }

    // Open a single window with all PDFs rendered in iframes
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Popup bloqueado pelo navegador. Permita popups para este site.")
      setPrintingAll(false)
      return
    }

    const iframesHtml = boletosComPDF
      .map((boleto, index) => {
        const url = boleto.asaas_bankslip_url || boleto.asaas_invoice_url
        return `
          <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #f1f5f9; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #334155;">
                Parcela ${boleto.numero_parcela}/${boleto.total_parcelas} - ${boleto.numero}
              </span>
              <span style="color: #64748b; font-size: 14px;">
                Vencimento: ${boleto.data_vencimento ? new Date(boleto.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
              </span>
            </div>
            <iframe 
              src="${url}" 
              style="width: 100%; height: 800px; border: none; display: block;"
              title="Boleto ${boleto.numero}"
            ></iframe>
          </div>
        `
      })
      .join("")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Boletos - Nota ${numeroBaseLimpo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f8fafc; 
            padding: 24px;
            color: #1e293b;
          }
          .header { 
            text-align: center; 
            margin-bottom: 24px; 
            padding: 20px;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            color: white;
            border-radius: 12px;
          }
          .header h1 { font-size: 22px; margin-bottom: 4px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .actions {
            text-align: center;
            margin-bottom: 24px;
          }
          .actions button {
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            color: white;
            border: none;
            padding: 12px 32px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .actions button:hover { opacity: 0.9; }
          @media print {
            .actions { display: none; }
            .header { 
              background: #2563eb !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            body { padding: 0; background: white; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Boletos - Nota ${numeroBaseLimpo}</h1>
          <p>${clienteNome ? `Cliente: ${clienteNome} | ` : ""}${boletosComPDF.length} parcela${boletosComPDF.length > 1 ? "s" : ""}</p>
        </div>
        <div class="actions">
          <button onclick="window.print()">Imprimir Todos</button>
        </div>
        ${iframesHtml}
      </body>
      </html>
    `)
    printWindow.document.close()

    setPrintingAll(false)
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

            {boletos.some((b) => b.asaas_bankslip_url || b.asaas_invoice_url) && boletos.length > 1 && (
              <div className="flex gap-3 justify-end bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
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
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visualizar Todas as Parcelas
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
                              {boleto.asaas_id && (
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
                                {boleto.asaas_linha_digitavel && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copiarLinhaDigitavel(boleto.asaas_linha_digitavel!)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 w-full justify-start"
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Copiar Linha Digitável
                                  </Button>
                                )}
                                {boleto.asaas_bankslip_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirPDF(boleto.asaas_bankslip_url!)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 w-full justify-start"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar PDF
                                  </Button>
                                )}
                                {boleto.asaas_invoice_url && !boleto.asaas_bankslip_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirPDF(boleto.asaas_invoice_url!)}
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 w-full justify-start"
                                  >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Ver Fatura
                                  </Button>
                                )}
                                {!boleto.asaas_id && <span className="text-xs text-gray-500">Boleto local - enviar ao Asaas</span>}
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
