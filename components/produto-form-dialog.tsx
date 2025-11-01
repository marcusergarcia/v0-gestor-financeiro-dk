"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, RefreshCw, Lock, Loader2 } from "lucide-react"
import { MarcaCombobox } from "@/components/marca-combobox"

interface Categoria {
  id: number
  nome: string
  codigo: string
}

interface ProdutoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto?: {
    id: number
    codigo: string
    descricao: string
    tipo?: string
    marca?: string
    ncm?: string
    valor_custo?: number
    valor_mao_obra?: number
    valor_unitario?: number
    margem_lucro?: number
    estoque?: number
    estoque_minimo?: number
    unidade?: string
    observacoes?: string
    ativo?: boolean
  } | null
  onSuccess?: (produtoCriado?: any) => void
}

export function ProdutoFormDialog({ open, onOpenChange, produto, onSuccess }: ProdutoFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingProduto, setLoadingProduto] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [gerandoCodigo, setGerandoCodigo] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Estados do formulário
  const [codigo, setCodigo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [marca, setMarca] = useState<string>("Nenhuma marca")
  const [ncm, setNcm] = useState("")
  const [valorCusto, setValorCusto] = useState<number>(0)
  const [valorMaoObra, setValorMaoObra] = useState<number>(180) // Default 180
  const [valorUnitario, setValorUnitario] = useState<number>(0)
  const [margemLucro, setMargemLucro] = useState<number>(30) // Default 30%
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(1) // Default 1
  const [unidade, setUnidade] = useState("UN")
  const [observacoes, setObservacoes] = useState("")
  const [ativo, setAtivo] = useState(true)

  const { toast } = useToast()

  const isEdicao = !!produto?.id
  const isServicoCategory = useMemo(() => {
    const categoria = categorias.find((c) => c.id.toString() === categoriaId)
    return categoria?.codigo?.toLowerCase() === "serv" || categoria?.codigo?.toLowerCase() === "servicos"
  }, [categorias, categoriaId])

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && !initialized) {
      loadCategorias()
      setInitialized(true)
    }
  }, [open, initialized])

  // Resetar estado quando o modal fechar
  useEffect(() => {
    if (!open) {
      setInitialized(false)
      resetForm()
    }
  }, [open])

  // Carregar dados do produto para edição
  useEffect(() => {
    if (open && produto?.id && categorias.length > 0) {
      loadProdutoCompleto(produto.id)
    } else if (open && !produto?.id) {
      // Novo produto - resetar formulário
      resetForm()
    }
  }, [open, produto?.id, categorias])

  const resetForm = useCallback(() => {
    setCodigo("")
    setDescricao("")
    setCategoriaId("")
    setMarca("Nenhuma marca")
    setNcm("")
    setValorCusto(0)
    setValorMaoObra(180) // Default 180
    setValorUnitario(0)
    setMargemLucro(30) // Default 30%
    setEstoqueAtual(0)
    setEstoqueMinimo(1) // Default 1
    setUnidade("UN")
    setObservacoes("")
    setAtivo(true)
  }, [])

  const loadCategorias = async () => {
    try {
      const response = await fetch("/api/categorias")
      const result = await response.json()
      if (result.success) {
        setCategorias(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const loadProdutoCompleto = async (produtoId: number) => {
    try {
      setLoadingProduto(true)
      console.log("Carregando produto completo:", produtoId)

      const response = await fetch(`/api/produtos/${produtoId}`)
      const result = await response.json()

      if (result.success) {
        const produtoData = result.data
        console.log("Dados do produto carregados:", produtoData)

        // Preencher todos os campos do formulário com os dados do produto
        setCodigo(produtoData.codigo || "")
        setDescricao(produtoData.descricao || "")
        setNcm(produtoData.ncm || "")
        setValorCusto(Number(produtoData.valor_custo) || 0)
        setValorMaoObra(Number(produtoData.valor_mao_obra) || 180)
        setValorUnitario(Number(produtoData.valor_unitario) || 0)
        setMargemLucro(Number(produtoData.margem_lucro) || 30)
        setEstoqueAtual(Number(produtoData.estoque) || 0)
        setEstoqueMinimo(Number(produtoData.estoque_minimo) || 1)
        setUnidade(produtoData.unidade || "UN")
        setObservacoes(produtoData.observacoes || "")
        setAtivo(produtoData.ativo !== false)

        // Definir marca - usar o valor do banco ou "Nenhuma marca" se for null/undefined
        if (produtoData.marca && produtoData.marca.trim() !== "") {
          setMarca(produtoData.marca)
        } else {
          setMarca("Nenhuma marca")
        }

        // Buscar categoria pelo nome do tipo
        if (produtoData.tipo) {
          const categoria = categorias.find((c) => c.nome === produtoData.tipo)
          if (categoria) {
            setCategoriaId(categoria.id.toString())
            console.log("Categoria encontrada:", categoria)
          } else {
            console.log("Categoria não encontrada para:", produtoData.tipo)
            setCategoriaId("")
          }
        } else {
          setCategoriaId("")
        }
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do produto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar produto",
        variant: "destructive",
      })
    } finally {
      setLoadingProduto(false)
    }
  }

  const gerarCodigo = useCallback(async () => {
    if (!categoriaId) return

    try {
      setGerandoCodigo(true)

      const response = await fetch("/api/produtos/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoria_id: Number.parseInt(categoriaId),
          marca_nome: marca !== "Nenhuma marca" ? marca : null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCodigo(result.data.codigo)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao gerar código",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar código:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar código do produto",
        variant: "destructive",
      })
    } finally {
      setGerandoCodigo(false)
    }
  }, [categoriaId, marca, toast])

  // Gerar código automaticamente apenas para novos produtos e quando necessário
  useEffect(() => {
    if (!isEdicao && categoriaId && (isServicoCategory || (marca && marca !== "Nenhuma marca")) && !codigo) {
      gerarCodigo()
    }
  }, [categoriaId, marca, isEdicao, isServicoCategory, codigo, gerarCodigo])

  // Calcular valor unitário automaticamente quando valor de custo ou margem mudarem
  const calcularValorUnitario = useCallback(() => {
    if (valorCusto > 0 && margemLucro >= 0) {
      // Fórmula: valor_custo * ((margem_lucro/100) + 1)
      const novoValor = valorCusto * (margemLucro / 100 + 1)
      setValorUnitario(Number(novoValor.toFixed(2)))
    } else if (valorCusto === 0) {
      setValorUnitario(0)
    }
  }, [valorCusto, margemLucro])

  // Recalcular valor unitário sempre que valor de custo ou margem mudarem
  useEffect(() => {
    calcularValorUnitario()
  }, [valorCusto, margemLucro, calcularValorUnitario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (!categoriaId) {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória",
        variant: "destructive",
      })
      return
    }

    // Validação de marca apenas para produtos (não serviços)
    if (!isServicoCategory && (!marca || marca === "Nenhuma marca")) {
      toast({
        title: "Erro",
        description: "Marca é obrigatória para produtos",
        variant: "destructive",
      })
      return
    }

    if (!codigo.trim()) {
      toast({
        title: "Erro",
        description: "Código é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const categoria = categorias.find((c) => c.id.toString() === categoriaId)

      const produtoData = {
        codigo: codigo.trim(),
        descricao: descricao.trim(),
        tipo: categoria?.nome || "",
        marca: isServicoCategory ? null : marca !== "Nenhuma marca" ? marca : null,
        ncm: ncm.trim() || null,
        valor_custo: valorCusto,
        valor_mao_obra: valorMaoObra,
        valor_unitario: valorUnitario,
        margem_lucro: margemLucro,
        estoque: estoqueAtual,
        estoque_minimo: estoqueMinimo,
        unidade: unidade,
        observacoes: observacoes.trim() || null,
        ativo: ativo,
      }

      const url = isEdicao ? `/api/produtos/${produto.id}` : "/api/produtos"
      const method = isEdicao ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(produtoData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Produto ${isEdicao ? "atualizado" : "criado"} com sucesso`,
        })
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || `Erro ao ${isEdicao ? "atualizar" : "criar"} produto`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduto) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando dados do produto...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdicao ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite as informações do produto" : "Preencha as informações do novo produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Código do produto"
                    readOnly={isEdicao}
                    className={isEdicao ? "bg-gray-50 text-gray-600" : ""}
                    required
                  />
                  {isEdicao && (
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                </div>
                {!isEdicao && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={gerarCodigo}
                    disabled={
                      gerandoCodigo || !categoriaId || (!isServicoCategory && (!marca || marca === "Nenhuma marca"))
                    }
                    className="px-3 bg-transparent"
                  >
                    {gerandoCodigo ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {!isEdicao && (
                <p className="text-xs text-gray-500 mt-1">Código gerado automaticamente baseado na categoria e marca</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do produto"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nome} ({categoria.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Marca */}
            <div>
              <Label htmlFor="marca">Marca {!isServicoCategory && "*"}</Label>
              <MarcaCombobox
                value={marca}
                onValueChange={setMarca}
                placeholder={isServicoCategory ? "N/A para serviços" : "Selecione uma marca"}
                disabled={isServicoCategory}
                className={isServicoCategory ? "bg-gray-50 text-gray-400" : ""}
              />
              {isServicoCategory && <p className="text-xs text-gray-500 mt-1">Marca não é aplicável para serviços</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NCM */}
            <div>
              <Label htmlFor="ncm">NCM</Label>
              <Input id="ncm" value={ncm} onChange={(e) => setNcm(e.target.value)} placeholder="Código NCM" />
            </div>

            {/* Unidade */}
            <div>
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valor de Custo */}
            <div>
              <Label htmlFor="valor_custo">Valor de Custo (R$)</Label>
              <Input
                id="valor_custo"
                type="number"
                step="0.01"
                min="0"
                value={valorCusto}
                onChange={(e) => setValorCusto(Number.parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Margem de Lucro */}
            <div>
              <Label htmlFor="margem_lucro">Margem de Lucro (%)</Label>
              <Input
                id="margem_lucro"
                type="number"
                step="0.01"
                min="0"
                value={margemLucro}
                onChange={(e) => setMargemLucro(Number.parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">Usado para calcular valor unitário</p>
            </div>

            {/* Valor Unitário */}
            <div>
              <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
              <div className="relative">
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorUnitario}
                  readOnly
                  className="bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Calculado: Custo × ((Margem/100) + 1)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valor Mão de Obra */}
            <div>
              <Label htmlFor="valor_mao_obra">Valor Mão de Obra (R$)</Label>
              <Input
                id="valor_mao_obra"
                type="number"
                step="0.01"
                min="0"
                value={valorMaoObra}
                onChange={(e) => setValorMaoObra(Number.parseFloat(e.target.value) || 180)}
              />
              <p className="text-xs text-gray-500 mt-1">Padrão: R$ 180,00</p>
            </div>

            {/* Estoque Atual */}
            <div>
              <Label htmlFor="estoque_atual">Estoque Atual</Label>
              <Input
                id="estoque_atual"
                type="number"
                min="0"
                value={estoqueAtual}
                onChange={(e) => setEstoqueAtual(Number.parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Estoque Mínimo */}
            <div>
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(Number.parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500 mt-1">Padrão: 1</p>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais sobre o produto"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center space-x-2">
            <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            <Label htmlFor="ativo">Produto ativo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : isEdicao ? "Atualizar" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
