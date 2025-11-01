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
import { ArrowLeft, Loader2, Eye, Calculator, Lock, Save, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { MarcaCombobox } from "@/components/marca-combobox"

interface Categoria {
  id: string
  codigo: string
  nome: string
}

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [previewCodigo, setPreviewCodigo] = useState("")
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "",
    marca: "Nenhuma marca",
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
    fetchCategorias()
  }, [])

  // Gerar preview do código sempre que categoria ou marca mudarem
  useEffect(() => {
    if (formData.tipo && (isServicoCategory || (formData.marca && formData.marca !== "Nenhuma marca"))) {
      generatePreviewCode()
    } else {
      setPreviewCodigo("")
    }
  }, [formData.tipo, formData.marca])

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias?limit=100")
      const result = await response.json()
      if (result.success) {
        const categoriasValidas = (result.data || []).filter(
          (cat: Categoria) => cat && cat.nome && cat.nome.trim() !== "" && cat.nome !== "0",
        )
        setCategorias(categoriasValidas)
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      setCategorias([])
    }
  }

  const generatePreviewCode = async () => {
    if (!formData.tipo) return

    setGeneratingCode(true)
    try {
      const response = await fetch("/api/produtos/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: formData.tipo,
          marca: formData.marca !== "Nenhuma marca" ? formData.marca : null,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setPreviewCodigo(result.data.codigo)
      } else {
        console.error("Erro ao gerar código:", result.message)
        setPreviewCodigo("")
      }
    } catch (error) {
      console.error("Erro ao gerar preview do código:", error)
      setPreviewCodigo("")
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (!formData.tipo) {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória",
        variant: "destructive",
      })
      return
    }

    // Validação de marca apenas para produtos (não serviços)
    if (!isServicoCategory && (!formData.marca || formData.marca === "Nenhuma marca")) {
      toast({
        title: "Erro",
        description: "Marca é obrigatória para produtos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const dadosParaEnvio = {
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        marca: isServicoCategory ? null : formData.marca !== "Nenhuma marca" ? formData.marca : null,
        ncm: formData.ncm.trim(),
        unidade: formData.unidade,
        valor_unitario: Number.parseFloat(formData.valor_unitario) || 0,
        valor_mao_obra: Number.parseFloat(formData.valor_mao_obra) || 0,
        valor_custo: Number.parseFloat(formData.valor_custo) || 0,
        margem_lucro: Number.parseFloat(formData.margem_lucro) || 0,
        estoque: Number.parseFloat(formData.estoque) || 0,
        estoque_minimo: Number.parseFloat(formData.estoque_minimo) || 0,
        observacoes: formData.observacoes.trim(),
        ativo: formData.ativo,
      }

      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnvio),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Produto criado com sucesso! Código: ${result.data.codigo}`,
        })
        router.push("/produtos")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar produto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro no submit:", error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isServicoCategory =
    categorias.find((c) => c.nome === formData.tipo)?.codigo?.toLowerCase() === "serv" ||
    categorias.find((c) => c.nome === formData.tipo)?.codigo?.toLowerCase() === "servicos"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push("/produtos")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-right">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Novo Produto
            </h1>
            <p className="text-gray-600">Cadastre um novo produto no sistema</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
            <CardTitle className="text-white">Informações do Produto</CardTitle>
            <CardDescription className="text-green-100">
              Preencha as informações do novo produto. O código será gerado automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Preview do Código */}
              {(previewCodigo || generatingCode) && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {generatingCode ? (
                    <>
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-800">Gerando código...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Código que será gerado:</span>
                      <span className="font-mono font-bold text-blue-900 text-lg">{previewCodigo}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generatePreviewCode}
                        className="ml-2 h-6 w-6 p-0"
                        title="Regenerar código"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              )}

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
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={`categoria-${categoria.id}`} value={categoria.nome}>
                            {categoria.nome} ({categoria.codigo})
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
                <Button type="button" variant="outline" onClick={() => router.push("/produtos")} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Criar Produto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
