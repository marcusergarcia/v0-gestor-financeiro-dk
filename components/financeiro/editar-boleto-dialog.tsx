"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Edit, Save, X } from "lucide-react"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: string
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
}

interface EditarBoletoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boleto: Boleto
  onSuccess: () => void
}

export function EditarBoletoDialog({ open, onOpenChange, boleto, onSuccess }: EditarBoletoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    valor: "",
    data_vencimento: "",
    data_pagamento: "",
    status: "",
    observacoes: "",
  })

  // Função para converter data ISO para formato YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  useEffect(() => {
    if (boleto && open) {
      setFormData({
        valor: boleto.valor.toString(),
        data_vencimento: formatDateForInput(boleto.data_vencimento),
        data_pagamento: boleto.data_pagamento ? formatDateForInput(boleto.data_pagamento) : "",
        status: boleto.status,
        observacoes: boleto.observacoes || "",
      })
    }
  }, [boleto, open])

  // Função para lidar com mudança de status
  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => {
      const updated = { ...prev, status: newStatus }

      // Se mudou para "pago" e não tem data de pagamento, usar data de vencimento
      if (newStatus === "pago" && !prev.data_pagamento) {
        updated.data_pagamento = prev.data_vencimento
      }

      // Se mudou para outro status que não seja "pago", limpar data de pagamento
      if (newStatus !== "pago") {
        updated.data_pagamento = ""
      }

      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.valor || !formData.data_vencimento || !formData.status) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validar data de pagamento se status for "pago"
    if (formData.status === "pago" && !formData.data_pagamento) {
      toast({
        title: "Erro",
        description: "Data de pagamento é obrigatória quando o status é 'Pago'",
        variant: "destructive",
      })
      return
    }

    const valor = Number.parseFloat(formData.valor)
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser um número positivo",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/boletos/${boleto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor,
          data_vencimento: formData.data_vencimento,
          data_pagamento: formData.status === "pago" ? formData.data_pagamento : null,
          status: formData.status,
          observacoes: formData.observacoes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Boleto atualizado com sucesso!",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar boleto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar boleto:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar boleto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white -m-6 mb-6 p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Edit className="h-5 w-5" />
            </div>
            Editar Boleto
          </DialogTitle>
          <DialogDescription className="text-blue-100">
            Altere as informações do boleto conforme necessário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Número</Label>
              <Input value={boleto.numero} disabled className="bg-gray-50 border-gray-200 text-gray-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Parcela</Label>
              <Input
                value={`${boleto.numero_parcela}/${boleto.total_parcelas}`}
                disabled
                className="bg-gray-50 border-gray-200 text-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Cliente</Label>
            <Input value={boleto.cliente_nome} disabled className="bg-gray-50 border-gray-200 text-gray-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-sm font-semibold text-gray-700">
                Valor *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_vencimento" className="text-sm font-semibold text-gray-700">
                Data de Vencimento *
              </Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
              Status *
            </Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === "pago" && (
            <div className="space-y-2">
              <Label htmlFor="data_pagamento" className="text-sm font-semibold text-gray-700">
                Data de Pagamento *
              </Label>
              <Input
                id="data_pagamento"
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-semibold text-gray-700">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-200 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
