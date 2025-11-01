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
}

interface PreviewParcelasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parcelas: ParcelaPreview[]
  cliente: Cliente | null
  numeroNota: string
  valorTotal: number
  formaPagamento: string
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white -m-6 mb-6 p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Preview das Parcelas
          </DialogTitle>
          <DialogDescription className="text-blue-100">
            Confirme as parcelas antes de emitir os boletos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente e Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{cliente?.nome || "Não informado"}</p>
                {cliente?.cnpj && <p className="text-sm text-gray-600">CNPJ: {cliente.cnpj}</p>}
                {cliente?.cpf && <p className="text-sm text-gray-600">CPF: {cliente.cpf}</p>}
                {cliente?.email && <p className="text-sm text-gray-600">Email: {cliente.email}</p>}
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Número da Nota:</span>
                  <span className="font-medium">{numeroNota}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor Total:</span>
                  <span className="font-bold text-green-700">{formatarMoeda(valorTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forma de Pagamento:</span>
                  <span className="font-medium">{formaPagamento}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Parcelas:</span>
                  <span className="font-medium">{parcelas.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Parcelas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhamento das Parcelas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Parcela</TableHead>
                      <TableHead className="font-semibold">Número do Boleto</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                      <TableHead className="font-semibold">Vencimento</TableHead>
                      <TableHead className="font-semibold">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelas.map((parcela) => (
                      <TableRow key={parcela.parcela} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <Badge variant="outline">{parcela.parcela}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{parcela.numero_boleto}</TableCell>
                        <TableCell className="font-semibold text-green-600">{formatarMoeda(parcela.valor)}</TableCell>
                        <TableCell>{formatarData(parcela.vencimento)}</TableCell>
                        <TableCell>{getStatusBadge(parcela.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Final */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Total Geral:</span>
                </div>
                <span className="text-2xl font-bold text-green-700">
                  {formatarMoeda(parcelas.reduce((acc, p) => acc + p.valor, 0))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onVoltar}
              disabled={loading}
              className="border-gray-200 hover:bg-gray-50 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={onEmitir}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
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
      </DialogContent>
    </Dialog>
  )
}
