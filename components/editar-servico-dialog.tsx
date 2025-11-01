"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2, Lock, Wrench } from "lucide-react"

interface EditarServicoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servico: {
    id: string
    codigo: string
    descricao: string
    valor_mao_obra: number
    observacoes?: string
    ativo: boolean
  } | null
  onSuccess?: () => void
}

export function EditarServicoDialog({ open, onOpenChange, servico, onSuccess }: EditarServicoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    descricao: "",
    valor_mao_obra: 180,
    observacoes: "",
    ativo: true,
  })

  const { toast } = useToast()

  // Carregar dados do serviço quando o modal abrir
  useEffect(() => {
    if (open && servico) {
      setFormData({
        descricao: servico.descricao || "",
        valor_mao_obra: servico.valor_mao_obra || 180,
        observacoes: servico.observacoes || "",
        ativo: servico.ativo !== false,
      })
    }
  }, [open, servico])

  // Resetar formulário quando fechar
  useEffect(() => {
    if (!open) {
      setFormData({
        descricao: "",
        valor_mao_obra: 180,
        observacoes: "",
        ativo: true,
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!servico?.id) return

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/produtos/${servico.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          descricao: formData.descricao.trim(),
          tipo: "Serviços",
          marca: "Nenhuma marca",
          ncm: null,
          unidade: "SV",
          valor_unitario: 0, // Para serviços, valor unitário deve ser 0
          valor_mao_obra: formData.valor_mao_obra,
          valor_custo: 0,
          margem_lucro: 0,
          estoque: 0,
          estoque_minimo: 0,
          observacoes: formData.observacoes.trim() || null,
          ativo: formData.ativo,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Serviço atualizado com sucesso",
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar serviço",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!servico) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Editar Serviço
          </DialogTitle>
          <DialogDescription>Edite as informações do serviço</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código (somente leitura) */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Código do Serviço</Label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <span className="font-mono font-bold text-gray-900">{servico.codigo}</span>
              <span className="text-xs text-gray-500 ml-2">(não pode ser alterado)</span>
            </div>
          </div>

          {/* Descrição do Serviço */}
          <div>
            <Label htmlFor="descricao">Descrição do Serviço *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Instalação de ar condicionado, Manutenção preventiva..."
              required
              className="mt-2"
            />
          </div>

          {/* Tipo (fixo) */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Tipo</Label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
              <p className="text-gray-600 font-medium">Serviços</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Tipo fixo para todos os serviços</p>
          </div>

          {/* Valor da Mão de Obra */}
          <div>
            <Label htmlFor="valor_mao_obra">Valor da Mão de Obra (R$) *</Label>
            <Input
              id="valor_mao_obra"
              type="number"
              step="0.01"
              min="0"
              value={formData.valor_mao_obra}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, valor_mao_obra: Number.parseFloat(e.target.value) || 0 }))
              }
              placeholder="180.00"
              required
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Valor padrão: R$ 180,00</p>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Detalhes sobre o serviço, tempo estimado, requisitos especiais..."
              rows={3}
              className="mt-2 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Informações adicionais sobre o serviço (opcional)</p>
          </div>

          {/* Serviço Ativo */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
            />
            <div>
              <Label htmlFor="ativo" className="font-medium">
                Serviço ativo
              </Label>
              <p className="text-xs text-gray-500">Serviços ativos aparecem nas listagens e podem ser selecionados</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Atualizar Serviço
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
