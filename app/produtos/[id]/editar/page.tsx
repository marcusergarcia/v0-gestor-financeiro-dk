"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Lock, Calculator, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { MarcaCombobox } from "@/components/marca-combobox"

interface Produto {
  id: string
  codigo: string
  descricao: string
  tipo?: string // Nome da categoria
  marca?: string // Nome da marca
  categoria_nome?: string
  marca_nome?: string
  ncm?: string
  unidade: string
  valor_unitario: number
  valor_mao_obra: number
  valor_custo: number
  margem_lucro: number
  estoque: number
  estoque_minimo: number
  observacoes?: string
  ativo: boolean
}

interface Categoria {
  id: string
  codigo: string
  nome: string
}

export default function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [produto, setProduto] = useState<Produto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "Nenhuma categoria", // Nome da categoria
    marca: "Nenhuma marca", // Nome da marca
    ncm: "",
    unidade: "UN",
    valor_unitario: "0.00",
    valor_mao_obra: "180.00",
    valor_custo: "0.00",
    margem_lucro: "30",
    estoque: "0",
    estoque_minimo: "1",
    observacoes: "",
    ativo: true,
  })

  // Função para calcular valor unitário automaticamente
  const calcularValorUnitario = (valorCusto: string, margemLucro: string): string => {
    const custo = Number.parseFloat(valorCusto) || 0
    const margem = Number.parseFloat(margemLucro) || 0

    if (custo === 0) return "0.00"

    const valorComMargem = custo * (1 + margem / 100)
    return valorComMargem.toFixed(2)
  }

  // Atualizar valor unitário sempre que custo ou margem mudarem
  useEffect(() => {
    const novoValorUnitario = calcularValorUnitario(formData.valor_custo, formData.margem_lucro)
    setFormData((prev) => ({ ...prev, valor_unitario: novoValorUnitario }))
  }, [formData.valor_custo, formData.margem_lucro])

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      await Promise.all([fetchProduto(resolvedParams.id), fetchCategorias()])
      setLoading(false)
    }
    loadData()
  }, [params])

  const fetchProduto = async (id: string) => {
    try {
      const response = await fetch(`/api/produtos/${id}`)
      const result = await response.json()

      if (result.success) {
        const produtoData = result.data
        setProduto(produtoData)
        setFormData({
          descricao: produtoData.descricao,
          tipo: produtoData.tipo || "Nenhuma categoria", // Nome da categoria
          marca: produtoData.marca || "Nenhuma marca", // Nome da marca
          ncm: produtoData.ncm || "",
          unidade: produtoData.unidade,
          valor_unitario: produtoData.valor_unitario.toFixed(2),
          valor_mao_obra: produtoData.valor_mao_obra.toFixed(2),
          valor_custo: produtoData.valor_custo.toFixed(2),
          margem_lucro: produtoData.margem_lucro.toString(),
          estoque: produtoData.estoque.toString(),
          estoque_minimo: produtoData.estoque_minimo.toString(),
          observacoes: produtoData.observacoes || "",
          ativo: produtoData.ativo,
        })
      } else {
        toast({
          title: "Erro",
          description: "Produto não encontrado",
          variant: "destructive",
        })
        router.push("/produtos")
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar produto",
        variant: "destructive",
      })
      router.push("/produtos")
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias?limit=100")
      const result = await response.json()
      if (result.success) {
        setCategorias(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!produto) return

    setSaving(true)

    try {
      const response = await fetch(`/api/produtos/${produto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          marca: formData.marca !== "Nenhuma marca" ? formData.marca : null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        })
        router.push("/produtos")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar produto",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto",
        variant: "destructive",
      })
      console.error("Erro:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando produto...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!produto) {
    return null
  }

  const isServicoCategory =
    categorias.find((c) => c.nome === formData.tipo)?.codigo?.toLowerCase() === "serv" ||
    categorias.find((c) => c.nome === formData.tipo)?.codigo?.toLowerCase() === "servicos"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-right">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Editar Produto
            </h1>
            <p className="text-gray-600">Edite as informações do produto</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
            <CardTitle className="text-white">Informações do Produto</CardTitle>
            <CardDescription className="text-blue-100">
              Edite as informações do produto. O código não pode ser alterado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Código atual */}
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Lock className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Código atual:</span>
                <span className="font-mono font-bold text-gray-900 text-lg">{produto.codigo}</span>
                <span className="text-xs text-gray-500 ml-2">(não pode ser alterado)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium">
                    Descrição *
                  </Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do produto"
                    required
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="text-sm font-medium">
                      Categoria *
                    </Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nenhuma categoria">Nenhuma categoria</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.nome}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marca" className="text-sm font-medium">
                      Marca {!isServicoCategory && "*"}
                    </Label>
                    <MarcaCombobox
                      value={formData.marca}
                      onValueChange={(value) => setFormData({ ...formData, marca: value })}
                      placeholder={isServicoCategory ? "N/A para serviços" : "Selecione uma marca"}
                      disabled={isServicoCategory}
                      className={isServicoCategory ? "bg-gray-50 text-gray-400" : ""}
                    />
                    {isServicoCategory && (
                      <p className="text-xs text-gray-500 mt-1">Marca não é aplicável para serviços</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade" className="text-sm font-medium">
                    Unidade
                  </Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade</SelectItem>
                      <SelectItem value="MT">Metro</SelectItem>
                      <SelectItem value="PC">Peça</SelectItem>
                      <SelectItem value="PCT">Pacote</SelectItem>
                      <SelectItem value="CJ">Conjunto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ncm" className="text-sm font-medium">
                    NCM
                  </Label>
                  <Input
                    id="ncm"
                    value={formData.ncm}
                    onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                    placeholder="Código NCM"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_custo" className="text-sm font-medium">
                    Valor de Custo (R$) *
                  </Label>
                  <Input
                    id="valor_custo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_custo}
                    onChange={(e) => setFormData({ ...formData, valor_custo: e.target.value })}
                    placeholder="0,00"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margem_lucro" className="text-sm font-medium">
                    Margem de Lucro (%)
                  </Label>
                  <Input
                    id="margem_lucro"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    value={formData.margem_lucro}
                    onChange={(e) => setFormData({ ...formData, margem_lucro: e.target.value })}
                    placeholder="30"
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">Padrão: 30%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_unitario" className="flex items-center gap-2 text-sm font-medium">
                    Valor Unitário (R$)
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <Calculator className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    id="valor_unitario"
                    type="text"
                    value={`R$ ${formData.valor_unitario}`}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed h-11"
                    title="Calculado automaticamente: Valor de Custo + Margem de Lucro"
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculado automaticamente: R$ {formData.valor_custo} + {formData.margem_lucro}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_mao_obra" className="text-sm font-medium">
                    Valor Mão de Obra (R$)
                  </Label>
                  <Input
                    id="valor_mao_obra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_mao_obra}
                    onChange={(e) => setFormData({ ...formData, valor_mao_obra: e.target.value })}
                    placeholder="180,00"
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">Padrão: R$ 180,00</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque" className="text-sm font-medium">
                    Estoque Atual
                  </Label>
                  <Input
                    id="estoque"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo" className="text-sm font-medium">
                    Estoque Mínimo
                  </Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                    placeholder="1"
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">Padrão: 1</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-sm font-medium">
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre o produto"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo" className="text-sm font-medium">
                  Produto ativo
                </Label>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Atualizar Produto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
