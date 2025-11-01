"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Wrench, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function NovoServicoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gerandoCodigo, setGerandoCodigo] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [formData, setFormData] = useState({
    descricao: "",
    valor_mao_obra: 180,
    observacoes: "",
    ativo: true,
  })

  // Gerar código automaticamente quando o componente carregar
  useEffect(() => {
    gerarCodigoServico()
  }, [])

  const gerarCodigoServico = async () => {
    try {
      setGerandoCodigo(true)

      // Buscar o próximo número disponível para serviços
      const response = await fetch("/api/produtos/generate-service-code")
      const result = await response.json()

      if (result.success) {
        setCodigo(result.data.codigo)
        console.log("Código gerado no frontend:", result.data.codigo)
      } else {
        console.error("Erro ao gerar código:", result.message)
        // Fallback: gerar código simples
        const timestamp = Date.now().toString().slice(-3)
        setCodigo(`015${timestamp}`)
      }
    } catch (error) {
      console.error("Erro ao gerar código:", error)
      // Fallback: gerar código simples
      const timestamp = Date.now().toString().slice(-3)
      setCodigo(`015${timestamp}`)
    } finally {
      setGerandoCodigo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.descricao.trim()) {
        toast({
          title: "Erro",
          description: "Descrição do serviço é obrigatória",
          variant: "destructive",
        })
        return
      }

      if (!codigo) {
        toast({
          title: "Erro",
          description: "Erro ao gerar código do serviço",
          variant: "destructive",
        })
        return
      }

      console.log("Enviando dados:", {
        codigo,
        descricao: formData.descricao.trim(),
        valor_mao_obra: formData.valor_mao_obra,
      })

      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo, // Usar o código já gerado
          descricao: formData.descricao.trim(),
          tipo: "Serviços",
          marca: "Nenhuma marca", // Definir marca padrão para serviços
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
          title: "Sucesso",
          description: `Serviço ${result.data.codigo} criado com sucesso!`,
        })
        router.push("/produtos?tab=servicos")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar serviço",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar serviço:", error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
              <Wrench className="h-8 w-8 text-orange-600" />
              Novo Serviço
            </h1>
            <p className="text-gray-600">Cadastre um novo serviço no sistema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Informações do Serviço
              </CardTitle>
              <CardDescription className="text-orange-100">Preencha os dados básicos do serviço</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Código gerado automaticamente */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Código do Serviço</Label>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-2">
                  {gerandoCodigo ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                      <span className="text-orange-600">Gerando código...</span>
                    </div>
                  ) : (
                    <p className="font-mono text-lg font-bold text-orange-600">{codigo}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Código gerado automaticamente (015 + numeração sequencial)</p>
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
                  <p className="text-xs text-gray-500">
                    Serviços ativos aparecem nas listagens e podem ser selecionados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || gerandoCodigo}
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
                  Criar Serviço
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
