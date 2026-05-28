"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ClienteCombobox } from "@/components/cliente-combobox"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { Receipt, Plus, Save } from "lucide-react"

interface Cliente {
  id: string
  nome: string
  codigo?: string
  cnpj?: string
  cpf?: string
  endereco?: string
  cep?: string
  email?: string
  telefone?: string
}

interface NovoReciboDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NovoReciboDialog({ open, onOpenChange, onSuccess }: NovoReciboDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false)
  const [refreshClientes, setRefreshClientes] = useState(0)

  const [formData, setFormData] = useState({
    valor: "",
    descricao: "",
    observacoes: "",
  })

  useEffect(() => {
    console.log("[v0] NovoReciboDialog montado, prop open:", open)
  }, [])

  useEffect(() => {
    console.log("[v0] Estado do dialog mudou, open:", open)
  }, [open])

  const handleNovoClienteSuccess = async (novoCliente: any) => {
    // Selecionar automaticamente o novo cliente
    setCliente({
      id: novoCliente.id.toString(),
      nome: novoCliente.nome,
      codigo: novoCliente.codigo,
      cnpj: novoCliente.cnpj,
      cpf: novoCliente.cpf,
      endereco: novoCliente.endereco,
      cep: novoCliente.cep,
      email: novoCliente.email,
      telefone: novoCliente.telefone,
    })

    // Atualizar a lista de clientes
    setRefreshClientes((prev) => prev + 1)

    toast({
      title: "Sucesso",
      description: "Cliente cadastrado e selecionado automaticamente",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cliente) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      })
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      })
      return
    }

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Informe a descrição do recibo",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/recibos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: Number.parseInt(cliente.id),
          valor: Number.parseFloat(formData.valor),
          descricao: formData.descricao,
          observacoes: formData.observacoes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Recibo #${data.data.numero} criado com sucesso`,
        })

        // Resetar formulário
        setFormData({
          valor: "",
          descricao: "",
          observacoes: "",
        })
        setCliente(null)

        // Chamar callback de sucesso
        if (onSuccess) {
          onSuccess()
        }

        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar recibo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar recibo:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar recibo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Novo Recibo</DialogTitle>
                <DialogDescription>Preencha os dados do recibo a ser emitido</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Cliente */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Cliente *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ClienteCombobox
                    value={cliente}
                    onValueChange={setCliente}
                    placeholder="Buscar cliente..."
                    key={refreshClientes}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNovoClienteDialog(true)}
                  className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </div>

              {cliente && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="font-medium text-blue-900">{cliente.nome}</div>
                  {cliente.codigo && <div className="text-sm text-blue-700">Código: {cliente.codigo}</div>}
                  {cliente.cnpj && <div className="text-sm text-blue-700">CNPJ: {cliente.cnpj}</div>}
                  {cliente.cpf && <div className="text-sm text-blue-700">CPF: {cliente.cpf}</div>}
                  {cliente.endereco && <div className="text-sm text-blue-700">{cliente.endereco}</div>}
                </div>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                required
                className="text-lg font-semibold"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o motivo do recibo (ex: Pagamento de serviços prestados...)"
                required
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais (opcional)"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Criar Recibo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Novo Cliente */}
      <ClienteFormDialog
        open={showNovoClienteDialog}
        onOpenChange={setShowNovoClienteDialog}
        onSuccess={handleNovoClienteSuccess}
      />
    </>
  )
}
