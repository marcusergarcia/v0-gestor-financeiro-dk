"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
        <Badge className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 font-medium px-3 py-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      )
    }

    if (status === "cancelado") {
      return (
        <Badge className="bg-gray-50/80 dark:bg-muted text-gray-700 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-gray-100 dark:hover:bg-muted font-medium px-3 py-1">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      )
    }

    if (isVencido || status === "vencido") {
      return (
        <Badge className="bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950 font-medium px-3 py-1 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>
      )
    }

    if (status === "aguardando_pagamento") {
      return (
        <Badge className="bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950/50 font-medium px-3 py-1">
          <Clock className="w-3 h-3 mr-1" />
          Aguardando
        </Badge>
      )
    }

    return (
      <Badge className="bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950 font-medium px-3 py-1">
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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const abrirPDF = (url: string) => {
    setPreviewUrl(url)
  }

  const imprimirTodosBoletos = async () => {
    setPrintingAll(true)

    const boletosComPDF = boletos.filter((b) => b.asaas_bankslip_url || b.asaas_invoice_url)

    if (boletosComPDF.length === 0) {
      alert("Nenhum boleto disponivel para impressao.")
      setPrintingAll(false)
      return
    }

    try {
      // Collect all PDF URLs
      const urls = boletosComPDF.map((b) => b.asaas_bankslip_url || b.asaas_invoice_url).filter(Boolean)

      // Call server-side API to merge all PDFs into one
      const response = await fetch("/api/boletos/merge-pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erro ao gerar PDF combinado")
      }

      const contentType = response.headers.get("Content-Type")
      if (!contentType || !contentType.includes("application/pdf")) {
        throw new Error("Resposta invalida da API")
      }

      // Get the merged PDF as a blob and open in new tab for viewing/printing
      const blob = await response.blob()
      if (blob.size < 100) {
        throw new Error("PDF gerado esta vazio")
      }

      const pdfUrl = URL.createObjectURL(blob)
      setPreviewUrl(pdfUrl)
    } catch (error) {
      console.error("Erro ao combinar PDFs:", error)
      // Fallback: open each PDF in a separate tab
      const fallback = confirm(
        "Nao foi possivel gerar o PDF combinado. Deseja abrir cada boleto em uma aba separada?"
      )
      if (fallback) {
        boletosComPDF.forEach((boleto, index) => {
          setTimeout(() => {
            const url = boleto.asaas_bankslip_url || boleto.asaas_invoice_url
            if (url) window.open(url, "_blank")
          }, index * 500)
        })
      }
    } finally {
      setPrintingAll(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* This component is rendered inside Gestão Financeira. Let's return the Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-border shadow-2xl bg-card text-foreground animate-in slide-in-from-right duration-300">
          <SheetHeader className="border-b border-border p-6 flex-shrink-0 bg-muted/30">
            <SheetTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="p-2 bg-muted rounded-lg text-foreground">
                <Eye className="h-5 w-5" />
              </div>
              Visualizar Boletos - Nota {numeroBaseLimpo}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm">
              {clienteNome && `Cliente: ${clienteNome}`}
              {boletos.length > 0 && ` • ${boletos.length} parcela${boletos.length > 1 ? "s" : ""}`}
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground text-sm">Carregando boletos...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-border shadow-sm bg-card">
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground/70" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="text-xl font-bold text-foreground">{resumo.total}</div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(resumo.valorTotal)}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-sm bg-card">
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="text-xl font-bold text-foreground">{resumo.pagos}</div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(resumo.valorPago)}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-sm bg-card">
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="text-xl font-bold text-foreground">{resumo.pendentes}</div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(resumo.valorPendente)}</p>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-sm bg-card">
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Vencidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="text-xl font-bold text-foreground">{resumo.vencidos}</div>
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Requer atenção</p>
                  </CardContent>
                </Card>
              </div>

              {boletos.some((b) => b.asaas_bankslip_url || b.asaas_invoice_url) && boletos.length > 1 && (
                <div className="flex gap-3 justify-end bg-muted/30 p-4 rounded-lg border border-border">
                  <Button
                    onClick={imprimirTodosBoletos}
                    disabled={printingAll}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  >
                    {printingAll ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gerando PDF combinado... Aguarde
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4 mr-2" />
                        Visualizar / Imprimir Todos ({boletos.filter((b) => b.asaas_bankslip_url || b.asaas_invoice_url).length} parcelas)
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Card className="border border-border shadow-sm overflow-hidden bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Lista de Parcelas - Nota {numeroBaseLimpo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {boletos.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-sm">Nenhum boleto encontrado para esta nota</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/10">
                            <TableHead className="font-semibold text-xs text-muted-foreground">Número Boleto</TableHead>
                            <TableHead className="font-semibold text-xs text-muted-foreground">Parcela</TableHead>
                            <TableHead className="font-semibold text-xs text-muted-foreground">Valor</TableHead>
                            <TableHead className="font-semibold text-xs text-muted-foreground">Vencimento</TableHead>
                            <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                            <TableHead className="font-semibold text-xs text-muted-foreground">Data Pagamento</TableHead>
                            <TableHead className="font-semibold text-xs text-muted-foreground">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {boletos.map((boleto) => (
                            <TableRow key={boleto.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                              <TableCell className="font-medium">
                                <Badge variant="outline" className="font-mono text-xs bg-background text-foreground border-border">
                                  {boleto.numero}
                                </Badge>
                                {boleto.asaas_id && (
                                  <Badge variant="secondary" className="ml-2 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Asaas
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono text-xs text-foreground bg-muted border-border">
                                  {boleto.numero_parcela}/{boleto.total_parcelas}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-foreground">{formatCurrency(boleto.valor)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{formatDate(boleto.data_vencimento)}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(boleto.status, boleto.data_vencimento)}</TableCell>
                              <TableCell>
                                {boleto.data_pagamento ? (
                                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>{formatDate(boleto.data_pagamento)}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5 py-1">
                                  {boleto.asaas_linha_digitavel && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copiarLinhaDigitavel(boleto.asaas_linha_digitavel!)}
                                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border-border bg-card w-full justify-start h-8"
                                    >
                                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                      Copiar Linha Digitável
                                    </Button>
                                  )}
                                  {boleto.asaas_bankslip_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => abrirPDF(boleto.asaas_bankslip_url!)}
                                      className="text-xs text-foreground hover:bg-muted border-border bg-card w-full justify-start h-8"
                                    >
                                      <Download className="h-3.5 w-3.5 mr-1.5" />
                                      Baixar PDF
                                    </Button>
                                  )}
                                  {boleto.asaas_invoice_url && !boleto.asaas_bankslip_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => abrirPDF(boleto.asaas_invoice_url!)}
                                      className="text-xs text-foreground hover:bg-muted border-border bg-card w-full justify-start h-8"
                                    >
                                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                                      Ver Fatura
                                    </Button>
                                  )}
                                  {!boleto.asaas_id && <span className="text-[10px] text-muted-foreground">Boleto local - enviar ao Asaas</span>}
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


            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-border shadow-2xl bg-card text-foreground animate-in slide-in-from-right duration-300">
          <SheetHeader className="border-b border-border p-6 flex-shrink-0 bg-muted/30">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <Printer className="h-5 w-5 text-indigo-500" />
                Imprimir Boleto
              </span>
              <div className="flex gap-2 mr-6">
                <Button
                  size="sm"
                  onClick={() => window.open(previewUrl!, "_blank")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 bg-white">
            <iframe src={previewUrl!} className="w-full h-full border-0" title="PDF Preview" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
