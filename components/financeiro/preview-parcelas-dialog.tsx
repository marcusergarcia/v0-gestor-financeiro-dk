"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, User, DollarSign, Calendar } from "lucide-react"
import type { Cliente } from "@/components/cliente-combobox"

interface ParcelaPreview {
  parcela: number
  numero_boleto: string
  valor: number
  vencimento: string
  status: string
  descricao?: string
  multa_percentual?: number
  juros_mes_percentual?: number
}

interface PreviewParcelasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parcelas: ParcelaPreview[]
  cliente: Cliente | null
  numeroNota: string
  valorTotal: number
  formaPagamento: string
  multaPercentual: number
  jurosMesPercentual: number
  onEmitir: () => void
  onVoltar: () => void
  loading: boolean
}

export function PreviewParcelasDialog({
  open,
  onOpenChange,
  parcelas,
  cliente,
  numeroNota,
  valorTotal,
  formaPagamento,
  multaPercentual,
  jurosMesPercentual,
  onEmitir,
  onVoltar,
  loading,
}: PreviewParcelasDialogProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  const formatarData = (data: string) => {
    // Corrigir o problema do fuso horário adicionando T00:00:00 para garantir que seja interpretada como data local
    const dataCorreta = new Date(data + "T00:00:00")
    return dataCorreta.toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    if (status === "Vencido") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            Preview das Parcelas
          </DialogTitle>
          <DialogDescription className="text-blue-100 text-sm">
            Confirme as parcelas antes de emitir os boletos
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white overflow-y-auto max-h-[calc(90vh-100px)] p-6">
          <div className="space-y-4">
            {/* Informações do Cliente e Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 px-4 pb-3">
                  <p className="font-medium text-sm">{cliente?.nome || "Não informado"}</p>
                  {cliente?.cnpj && <p className="text-xs text-gray-600">CNPJ: {cliente.cnpj}</p>}
                  {cliente?.cpf && <p className="text-xs text-gray-600">CPF: {cliente.cpf}</p>}
                  {cliente?.email && <p className="text-xs text-gray-600">Email: {cliente.email}</p>}
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-base text-green-800 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 px-4 pb-3">
                  <div className="flex justify-between text-sm">
                    <span>Número da Nota:</span>
                    <span className="font-medium">{numeroNota}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor Total:</span>
                    <span className="font-bold text-green-700">{formatarMoeda(valorTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Forma de Pagamento:</span>
                    <span className="font-medium">{formaPagamento}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total de Parcelas:</span>
                    <span className="font-medium">{parcelas.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Multa por Atraso:</span>
                    <span className="font-medium">{multaPercentual.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Juros ao Mês:</span>
                    <span className="font-medium">{jurosMesPercentual.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Parcelas */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Detalhamento das Parcelas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold w-20 text-xs">Parcela</TableHead>
                        <TableHead className="font-semibold w-44 text-xs">Número do Boleto</TableHead>
                        <TableHead className="font-semibold text-xs">Descrição</TableHead>
                        <TableHead className="font-semibold w-32 text-xs">Valor</TableHead>
                        <TableHead className="font-semibold w-28 text-xs">Vencimento</TableHead>
                        <TableHead className="font-semibold w-20 text-xs text-center">Multa</TableHead>
                        <TableHead className="font-semibold w-20 text-xs text-center">Juros</TableHead>
                        <TableHead className="font-semibold w-24 text-xs">Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelas.map((parcela) => (
                        <TableRow key={parcela.parcela} className="hover:bg-gray-50">
                          <TableCell className="font-medium py-2">
                            <Badge variant="outline" className="text-xs">
                              {parcela.parcela}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs py-2">{parcela.numero_boleto}</TableCell>
                          <TableCell className="text-xs py-2 text-gray-600">{parcela.descricao || "-"}</TableCell>
                          <TableCell className="font-semibold text-green-600 text-xs py-2">
                            {formatarMoeda(parcela.valor)}
                          </TableCell>
                          <TableCell className="text-xs py-2">{formatarData(parcela.vencimento)}</TableCell>
                          <TableCell className="text-xs py-2 text-center text-red-600">
                            {parcela.multa_percentual?.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-xs py-2 text-center text-orange-600">
                            {parcela.juros_mes_percentual?.toFixed(2)}%
                          </TableCell>
                          <TableCell className="py-2">{getStatusBadge(parcela.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Final */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-sm">Total Geral:</span>
                  </div>
                  <span className="text-xl font-bold text-green-700">
                    {formatarMoeda(parcelas.reduce((acc, p) => acc + p.valor, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={onVoltar}
                disabled={loading}
                className="border-gray-200 hover:bg-gray-50 bg-transparent text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={onEmitir}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Emitindo...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Emitir Boletos
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
