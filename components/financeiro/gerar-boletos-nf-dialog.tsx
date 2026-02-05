"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { FileText, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface GerarBoletosNFDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notaFiscal: {
    id: number
    valor: number
    cliente_nome: string
    descricao_servico: string
  } | null
  onSuccess: () => void
}

export function GerarBoletosNFDialog({ open, onOpenChange, notaFiscal, onSuccess }: GerarBoletosNFDialogProps) {
  const [primeiroVencimento, setPrimeiroVencimento] = useState("")
  const [numeroParcelas, setNumeroParcelas] = useState("1")
  const [intervalo, setIntervalo] = useState("30")
  const [multaPercentual, setMultaPercentual] = useState("2.00")
  const [jurosMesPercentual, setJurosMesPercentual] = useState("2.00")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const hoje = new Date()
      hoje.setDate(hoje.getDate() + 7)
      setPrimeiroVencimento(hoje.toISOString().split("T")[0])
    }
  }, [open])

  const handleGerar = async () => {
    if (!notaFiscal) return

    if (!primeiroVencimento) {
      toast({ title: "Erro", description: "Informe a data do primeiro vencimento", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/notas-fiscais/${notaFiscal.id}/gerar-boletos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primeiro_vencimento: primeiroVencimento,
          numero_parcelas: Number.parseInt(numeroParcelas),
          intervalo: Number.parseInt(intervalo),
          multa_percentual: Number.parseFloat(multaPercentual),
          juros_mes_percentual: Number.parseFloat(jurosMesPercentual),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: result.message,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao gerar boletos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar boletos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!notaFiscal) return null

  const numParcelas = Number.parseInt(numeroParcelas) || 1
  const valorParcela = notaFiscal.valor / numParcelas

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-0 shadow-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Gerar Boletos da NFS-e
          </DialogTitle>
          <DialogDescription className="text-green-100">
            Gere boletos vinculados a esta nota fiscal
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 bg-white">
          {/* Info da NFS-e */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-600">Cliente: <span className="font-medium text-gray-900">{notaFiscal.cliente_nome}</span></p>
            <p className="text-sm text-gray-600">Valor: <span className="font-semibold text-green-600">{formatCurrency(notaFiscal.valor)}</span></p>
            <p className="text-sm text-gray-600 truncate">Servico: {notaFiscal.descricao_servico}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Primeiro Vencimento *</Label>
              <Input
                type="date"
                value={primeiroVencimento}
                onChange={(e) => setPrimeiroVencimento(e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Numero de Parcelas</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Intervalo (dias)</Label>
              <Input
                type="number"
                min="1"
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Valor por Parcela</Label>
              <Input
                value={formatCurrency(valorParcela)}
                disabled
                className="border-gray-200 bg-gray-50 text-green-700 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Multa (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={multaPercentual}
                onChange={(e) => setMultaPercentual(e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Juros a.m. (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={jurosMesPercentual}
                onChange={(e) => setJurosMesPercentual(e.target.value)}
                className="border-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="border-t bg-gray-50 p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={handleGerar}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Gerar {numParcelas} Boleto{numParcelas > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
