"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResizableTable } from "@/components/ui/resizable-table"
import { Search, Package, Tag, Award, Edit, Plus, AlertTriangle, CheckCircle, Wrench, X, ChevronRight, Phone, Mail, MapPin, FileText } from "lucide-react"
import { ProdutoDeleteDialog } from "@/components/produto-delete-dialog"
import { CategoriaDeleteDialog } from "@/components/categoria-delete-dialog"
import { MarcaDeleteDialog } from "@/components/marca-delete-dialog"
import { EditarServicoDialog } from "@/components/editar-servico-dialog"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_nome?: string
  categoria_codigo?: string
  categoria_id: string
  marca_nome?: string
  marca_sigla?: string
  marca_id: string
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
  total_produtos: number
  ativo: boolean
}

interface Marca {
  id: string
  nome: string
  sigla: string
  contador: number
  total_produtos: number
  ativo: boolean
}

export default function ProdutosPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [servicos, setServicos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [searchProdutos, setSearchProdutos] = useState("")
  const [searchServicos, setSearchServicos] = useState("")
  const [searchCategorias, setSearchCategorias] = useState("")
  const [searchMarcas, setSearchMarcas] = useState("")
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [editandoServico, setEditandoServico] = useState<any>(null)
  const [servicoDialogOpen, setServicoDialogOpen] = useState(false)
  const [produtoCardFilter, setProdutoCardFilter] = useState<string>("all")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all")
  const [selectedMarca, setSelectedMarca] = useState<string>("all")
  const [expandedProdutoId, setExpandedProdutoId] = useState<string | null>(null)
  const [expandedServicoId, setExpandedServicoId] = useState<string | null>(null)

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const fetchProdutos = async () => {
    try {
      const response = await fetch(`/api/produtos?search=${searchProdutos}&limit=1000`)
      const result = await response.json()
      if (result.success) {
        // Filtrar produtos que NÃO são serviços
        const produtosFiltrados = Array.isArray(result.data)
          ? result.data.filter(
              (produto: Produto) =>
                produto.categoria_nome?.toLowerCase() !== "serviços" &&
                produto.categoria_nome?.toLowerCase() !== "servicos",
            )
          : []
        setProdutos(produtosFiltrados)
      } else {
        setProdutos([])
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  const fetchServicos = async () => {
    try {
      const response = await fetch(`/api/produtos?search=${searchServicos}&categoria=serviços&limit=1000`)
      const result = await response.json()
      if (result.success) {
        setServicos(Array.isArray(result.data) ? result.data : [])
      } else {
        setServicos([])
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error)
      setServicos([])
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`/api/categorias?search=${searchCategorias}&limit=1000`)
      const result = await response.json()
      if (result.success) {
        setCategorias(Array.isArray(result.data) ? result.data : [])
      } else {
        setCategorias([])
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      setCategorias([])
    }
  }

  const fetchMarcas = async () => {
    try {
      const response = await fetch(`/api/marcas?search=${searchMarcas}&limit=1000`)
      const result = await response.json()
      if (result.success) {
        setMarcas(Array.isArray(result.data) ? result.data : [])
      } else {
        setMarcas([])
      }
    } catch (error) {
      console.error("Erro ao buscar marcas:", error)
      setMarcas([])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProdutos()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchProdutos])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServicos()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchServicos])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategorias()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchCategorias])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarcas()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchMarcas])

  const isServico = (codigo: string) => {
    return codigo.startsWith("015")
  }

  // Filtrar produtos pelo cardFilter, categoria e marca
  const filteredProdutos = useMemo(() => {
    let result = produtos

    if (produtoCardFilter === "ativos") {
      result = result.filter((p) => p.ativo)
    } else if (produtoCardFilter === "estoque_baixo") {
      result = result.filter((p) => p.estoque <= p.estoque_minimo && p.estoque_minimo > 0)
    }

    if (selectedCategoria !== "all") {
      result = result.filter((p) => p.categoria_nome === selectedCategoria)
    }

    if (selectedMarca !== "all") {
      result = result.filter((p) => p.marca_nome === selectedMarca)
    }

    return result
  }, [produtos, produtoCardFilter, selectedCategoria, selectedMarca])

  const handleProdutoCardToggle = (filter: string) => {
    setProdutoCardFilter((prev) => (prev === filter ? "all" : filter))
    setExpandedProdutoId(null)
  }

  const getFilterLabel = (filter: string) => {
    if (filter === "ativos") return "Ativos"
    if (filter === "estoque_baixo") return "Estoque Baixo"
    return ""
  }

  const renderProdutoTable = (produtosList: Produto[]) => (
    <ResizableTable<Produto>
      storageKey="produtos"
      columns={[
        { key: "codigo",       label: "Código",    width: 100, sortable: true },
        { key: "ncm",          label: "NCM",       width: 90,  sortable: false },
        { key: "descricao",    label: "Descrição", width: 200, sortable: true },
        { key: "categoria_nome", label: "Categoria", width: 130, sortable: true },
        { key: "marca_nome",   label: "Marca",     width: 110, sortable: true },
        { key: "valor_unitario", label: "Valor",    width: 100, sortable: true },
        { key: "estoque",      label: "Estoque",   width: 90,  sortable: true },
        { key: "ativo",        label: "Status",    width: 80,  sortable: true },
        { key: "acoes",        label: "Ações",     width: 80,  sortable: false, noResize: true },
      ]}
      data={produtosList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro produto</p>
          <Button onClick={() => router.push("/produtos/novo")} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeiro Produto
          </Button>
        </div>
      }
      renderCell={(produto, col) => {
        switch (col) {
          case "codigo": return <Badge variant="outline" className="font-mono text-xs">{produto.codigo}</Badge>
          case "ncm":
            return produto.ncm
              ? <Badge className="bg-purple-100 text-purple-800 font-mono text-[10px]">{produto.ncm}</Badge>
              : <Badge variant="outline" className="text-gray-500 border-gray-300 text-[10px]">Sem NCM</Badge>
          case "descricao": return <span className="font-medium text-sm truncate" title={produto.descricao}>{produto.descricao}</span>
          case "categoria_nome":
            return produto.categoria_nome && produto.categoria_nome !== "0"
              ? <Badge className="bg-blue-100 text-blue-800 text-xs truncate max-w-[110px]" title={produto.categoria_nome}>{produto.categoria_nome}</Badge>
              : <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">Sem cat.</Badge>
          case "marca_nome":
            return produto.marca_nome && produto.marca_nome !== "0"
              ? <Badge className="bg-green-100 text-green-800 text-xs truncate max-w-[100px]" title={produto.marca_nome}>{produto.marca_nome}</Badge>
              : <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">Sem marca</Badge>
          case "valor_unitario": return <span className="font-semibold text-green-600 text-sm">{formatCurrency(produto.valor_unitario)}</span>
          case "estoque":
            return (
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">{produto.estoque}</span>
                {produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0
                  ? <Badge className="bg-red-100 text-red-800 animate-pulse text-[10px] px-1"><AlertTriangle className="h-3 w-3" /></Badge>
                  : <Badge className="bg-green-100 text-green-800 text-[10px] px-1"><CheckCircle className="h-3 w-3" /></Badge>}
              </div>
            )
          case "ativo":
            return (
              <Badge variant={produto.ativo ? "default" : "secondary"}
                className={`text-xs ${produto.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {produto.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            return (
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm"
                  onClick={() => {
                    if (isServico(produto.codigo)) {
                      setEditandoServico({ id: produto.id, codigo: produto.codigo, descricao: produto.descricao, valor_mao_obra: produto.valor_mao_obra, observacoes: produto.observacoes, ativo: produto.ativo })
                      setServicoDialogOpen(true)
                    } else {
                      router.push(`/produtos/${produto.id}/editar`)
                    }
                  }}
                  className="text-blue-600 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
                <ProdutoDeleteDialog produto={produto} onSuccess={() => { fetchProdutos(); fetchServicos() }} />
              </div>
            )
          default: return null
        }
      }}
    />
  )

  const renderServicoTable = (servicosList: Produto[]) => (
    <ResizableTable<Produto>
      storageKey="servicos"
      columns={[
        { key: "codigo",        label: "Código",          width: 100, sortable: true },
        { key: "descricao",     label: "Descrição",        width: 250, sortable: true },
        { key: "categoria_nome",label: "Categoria",         width: 130, sortable: true },
        { key: "valor_mao_obra",label: "Valor Mão de Obra", width: 140, sortable: true },
        { key: "ativo",         label: "Status",           width: 80,  sortable: true },
        { key: "acoes",         label: "Ações",            width: 80,  sortable: false, noResize: true },
      ]}
      data={servicosList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Wrench className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço encontrado</h3>
          <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro serviço</p>
          <Button onClick={() => router.push("/produtos/servicos/novo")} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeiro Serviço
          </Button>
        </div>
      }
      renderCell={(servico, col) => {
        switch (col) {
          case "codigo": return <Badge variant="outline" className="font-mono text-xs">{servico.codigo}</Badge>
          case "descricao": return <span className="font-medium text-sm truncate" title={servico.descricao}>{servico.descricao}</span>
          case "categoria_nome":
            return <Badge className="bg-orange-100 text-orange-800 text-xs"><Wrench className="h-3 w-3 mr-1" />Serviços</Badge>
          case "valor_mao_obra": return <span className="font-semibold text-orange-600 text-sm">{formatCurrency(servico.valor_mao_obra)}</span>
          case "ativo":
            return (
              <Badge variant={servico.ativo ? "default" : "secondary"}
                className={`text-xs ${servico.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {servico.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            return (
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm"
                  onClick={() => { setEditandoServico({ id: servico.id, codigo: servico.codigo, descricao: servico.descricao, valor_mao_obra: servico.valor_mao_obra, observacoes: servico.observacoes, ativo: servico.ativo }); setServicoDialogOpen(true) }}
                  className="text-blue-600 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
                <ProdutoDeleteDialog produto={servico} onSuccess={() => { fetchProdutos(); fetchServicos() }} />
              </div>
            )
          default: return null
        }
      }}
    />
  )

  const renderCategoriaTable = (categoriasList: Categoria[]) => (
    <ResizableTable<Categoria>
      storageKey="categorias"
      columns={[
        { key: "codigo", label: "Código", width: 100, sortable: true },
        { key: "nome",   label: "Nome",   width: 250, sortable: true },
        { key: "ativo",  label: "Status", width: 100, sortable: true },
        { key: "acoes",  label: "Ações",  width: 80,  sortable: false, noResize: true },
      ]}
      data={categoriasList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Tag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-gray-600 mb-4">Comece cadastrando sua primeira categoria</p>
          <Button onClick={() => router.push("/produtos/categorias/nova")} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeira Categoria
          </Button>
        </div>
      }
      renderCell={(categoria, col) => {
        switch (col) {
          case "codigo": return <Badge variant="outline" className="font-mono">{categoria.codigo}</Badge>
          case "nome": return <span className="font-medium truncate" title={categoria.nome}>{categoria.nome}</span>
          case "ativo":
            return (
              <Badge variant={categoria.ativo ? "default" : "secondary"}
                className={`text-xs ${categoria.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {categoria.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            return (
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => router.push(`/produtos/categorias/${categoria.id}/editar`)}
                  className="text-blue-600 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
                <CategoriaDeleteDialog categoria={categoria} onSuccess={fetchCategorias} />
              </div>
            )
          default: return null
        }
      }}
    />
  )

  const renderMarcaTable = (marcasList: Marca[]) => (
    <ResizableTable<Marca>
      storageKey="marcas"
      columns={[
        { key: "nome",     label: "Nome",    width: 200, sortable: true },
        { key: "sigla",    label: "Sigla",   width: 100, sortable: true },
        { key: "contador", label: "Contador",width: 90,  sortable: true },
        { key: "ativo",    label: "Status",  width: 90,  sortable: true },
        { key: "acoes",    label: "Ações",   width: 80,  sortable: false, noResize: true },
      ]}
      data={marcasList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma marca encontrada</h3>
          <p className="text-gray-600 mb-4">Comece cadastrando sua primeira marca</p>
          <Button onClick={() => router.push("/produtos/marcas/nova")} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeira Marca
          </Button>
        </div>
      }
      renderCell={(marca, col) => {
        switch (col) {
          case "nome": return <span className="font-medium truncate" title={marca.nome}>{marca.nome}</span>
          case "sigla":
            return marca.sigla
              ? <Badge variant="outline" className="font-mono">{marca.sigla}</Badge>
              : <span className="text-gray-400">-</span>
          case "contador": return <Badge className="bg-purple-100 text-purple-800 text-xs">{marca.contador}</Badge>
          case "ativo":
            return (
              <Badge variant={marca.ativo ? "default" : "secondary"}
                className={`text-xs ${marca.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {marca.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            return (
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => router.push(`/produtos/marcas/${marca.id}/editar`)}
                  className="text-purple-600 hover:bg-purple-50 border-purple-200 bg-transparent h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
                <MarcaDeleteDialog marca={marca} onSuccess={fetchMarcas} />
              </div>
            )
          default: return null
        }
      }}
    />
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando produtos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 space-y-4 p-4 pt-6 pb-24 md:pb-6">
        <div className="flex items-center gap-4 mb-8">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
            />
          )}
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Produtos & Serviços
            </h2>
            <p className="text-gray-600 mt-1">Gerencie produtos, serviços, categorias e marcas</p>
          </div>
        </div>

        <Tabs defaultValue="produtos" className="space-y-4">
          {/* Desktop: TabsList normal */}
          <TabsList className="hidden md:grid w-full grid-cols-4 bg-white shadow-lg rounded-lg p-1">
            <TabsTrigger
              value="produtos"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger
              value="servicos"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <Wrench className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger
              value="categorias"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Tag className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger
              value="marcas"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Award className="h-4 w-4" />
              Marcas
            </TabsTrigger>
          </TabsList>

          {/* Mobile: Grid 4x1 fixo no rodapé */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-2xl">
            <TabsList className="grid grid-cols-4 w-full h-auto p-2 gap-1 bg-gradient-to-r from-green-50 to-blue-50">
              <TabsTrigger
                value="produtos"
                className="flex flex-col items-center gap-1 py-3 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded"
              >
                <Package className="h-5 w-5" />
                <span>Produtos</span>
              </TabsTrigger>
              <TabsTrigger
                value="servicos"
                className="flex flex-col items-center gap-1 py-3 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded"
              >
                <Wrench className="h-5 w-5" />
                <span>Serviços</span>
              </TabsTrigger>
              <TabsTrigger
                value="categorias"
                className="flex flex-col items-center gap-1 py-3 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded"
              >
                <Tag className="h-5 w-5" />
                <span>Categorias</span>
              </TabsTrigger>
              <TabsTrigger
                value="marcas"
                className="flex flex-col items-center gap-1 py-3 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded"
              >
                <Award className="h-5 w-5" />
                <span>Marcas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="produtos" className="space-y-4">
            {/* Stats Cards — filtros clicáveis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total */}
              <Card
                className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
                  produtoCardFilter === "all" ? "ring-2 ring-blue-400 ring-offset-1" : "opacity-75 hover:opacity-100"
                }`}
                onClick={() => handleProdutoCardToggle("all")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-5 pb-1 lg:pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium text-blue-700">Total</CardTitle>
                  <Package className="h-3 w-3 lg:h-5 lg:w-5 text-blue-600" />
                </CardHeader>
                <CardContent className="p-3 lg:p-5 pt-0">
                  <div className="text-lg lg:text-3xl font-bold text-blue-800">{produtos.length}</div>
                  <p className="text-[10px] lg:text-xs text-blue-600 mt-0.5">Produtos cadastrados</p>
                </CardContent>
              </Card>

              {/* Ativos */}
              <Card
                className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
                  produtoCardFilter === "ativos" ? "ring-2 ring-green-400 ring-offset-1" : "opacity-75 hover:opacity-100"
                }`}
                onClick={() => handleProdutoCardToggle("ativos")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-5 pb-1 lg:pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium text-green-700">Ativos</CardTitle>
                  <CheckCircle className="h-3 w-3 lg:h-5 lg:w-5 text-green-600" />
                </CardHeader>
                <CardContent className="p-3 lg:p-5 pt-0">
                  <div className="text-lg lg:text-3xl font-bold text-green-800">{produtos.filter((p) => p.ativo).length}</div>
                  <p className="text-[10px] lg:text-xs text-green-600 mt-0.5">Produtos ativos</p>
                </CardContent>
              </Card>

              {/* Estoque Baixo */}
              <Card
                className={`border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
                  produtoCardFilter === "estoque_baixo" ? "ring-2 ring-red-400 ring-offset-1" : "opacity-75 hover:opacity-100"
                }`}
                onClick={() => handleProdutoCardToggle("estoque_baixo")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-5 pb-1 lg:pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium text-red-700">Estoque Baixo</CardTitle>
                  <AlertTriangle className="h-3 w-3 lg:h-5 lg:w-5 text-red-600" />
                </CardHeader>
                <CardContent className="p-3 lg:p-5 pt-0">
                  <div className="text-lg lg:text-3xl font-bold text-red-800">{produtos.filter((p) => p.estoque <= p.estoque_minimo && p.estoque_minimo > 0).length}</div>
                  <p className="text-[10px] lg:text-xs text-red-600 mt-0.5">Abaixo do mínimo</p>
                </CardContent>
              </Card>
            </div>

            {/* Active filter indicators */}
            {(produtoCardFilter !== "all" || selectedCategoria !== "all" || selectedMarca !== "all") && (
              <div className="flex items-center gap-2 px-1 flex-wrap">
                {produtoCardFilter !== "all" && (
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-blue-600 text-white border-0 pl-2.5 pr-1.5 py-1 gap-1.5">
                    Status: {getFilterLabel(produtoCardFilter)}
                    <button
                      onClick={() => setProdutoCardFilter("all")}
                      className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategoria !== "all" && (
                  <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200 pl-2.5 pr-1.5 py-1 gap-1.5">
                    Categoria: {selectedCategoria}
                    <button
                      onClick={() => setSelectedCategoria("all")}
                      className="ml-0.5 rounded-full hover:bg-purple-200 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 text-purple-700" />
                    </button>
                  </Badge>
                )}
                {selectedMarca !== "all" && (
                  <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200 pl-2.5 pr-1.5 py-1 gap-1.5">
                    Marca: {selectedMarca}
                    <button
                      onClick={() => setSelectedMarca("all")}
                      className="ml-0.5 rounded-full hover:bg-amber-200 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 text-amber-700" />
                    </button>
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* ═══ MOBILE VIEW — Cards de produtos ═══ */}
            <div className="md:hidden space-y-3">
              <div className="flex flex-col gap-2 px-1">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 mr-3">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchProdutos}
                      onChange={(e) => setSearchProdutos(e.target.value)}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push("/produtos/novo")}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white h-9 px-3"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Novo
                  </Button>
                </div>
                {/* Mobile Dropdowns */}
                <div className="flex gap-2">
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger className="w-1/2 h-9 text-xs bg-white border-gray-200 text-gray-700">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                    <SelectTrigger className="w-1/2 h-9 text-xs bg-white border-gray-200 text-gray-700">
                      <SelectValue placeholder="Marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Marcas</SelectItem>
                      {marcas.map((m) => (
                        <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
                {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? "s" : ""}
              </p>

              {filteredProdutos.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">Nenhum produto encontrado</h3>
                  <p className="text-sm text-gray-500 mb-4">Tente ajustar os filtros</p>
                </div>
              ) : (
                filteredProdutos.map((produto) => {
                  const isExpanded = expandedProdutoId === produto.id
                  const isLowStock = produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0

                  return (
                    <div
                      key={produto.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        isLowStock
                          ? "border-red-200 bg-gradient-to-r from-red-50/80 to-white"
                          : "border-gray-200 bg-white"
                      } ${isExpanded ? "shadow-lg ring-1 ring-green-200" : "shadow-sm hover:shadow-md"}`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedProdutoId(isExpanded ? null : produto.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3"
                      >
                        {/* Ícone */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isLowStock
                            ? "bg-red-100 text-red-700"
                            : produto.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                        }`}>
                          {produto.codigo.slice(-2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-gray-900 truncate block">{produto.descricao}</span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-gray-500 font-mono">{produto.codigo}</span>
                            {produto.marca_nome && produto.marca_nome !== "0" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700">
                                {produto.marca_nome}
                              </Badge>
                            )}
                            {isLowStock && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-0 animate-pulse">
                                Estoque!
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 mr-1">
                          <div className="text-sm font-bold text-green-600">{formatCurrency(produto.valor_unitario)}</div>
                          <div className="text-[10px] text-gray-500">Est: {produto.estoque}</div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? "rotate-90" : ""
                        }`} />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-gray-100 pt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {produto.categoria_nome && produto.categoria_nome !== "0" && (
                                <div className="bg-purple-50 rounded-lg p-2.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Tag className="h-3 w-3 text-purple-400" />
                                    <span className="text-[10px] font-medium text-purple-500 uppercase">Categoria</span>
                                  </div>
                                  <p className="text-xs font-medium text-purple-800 truncate">{produto.categoria_nome}</p>
                                </div>
                              )}
                              {produto.marca_nome && produto.marca_nome !== "0" && (
                                <div className="bg-amber-50 rounded-lg p-2.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Award className="h-3 w-3 text-amber-400" />
                                    <span className="text-[10px] font-medium text-amber-500 uppercase">Marca</span>
                                  </div>
                                  <p className="text-xs font-medium text-amber-800 truncate">{produto.marca_nome}</p>
                                </div>
                              )}
                              {produto.ncm && (
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-medium text-gray-500 uppercase">NCM</span>
                                  </div>
                                  <p className="text-xs font-mono text-gray-800">{produto.ncm}</p>
                                </div>
                              )}
                              <div className="bg-gray-50 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Package className="h-3 w-3 text-gray-400" />
                                  <span className="text-[10px] font-medium text-gray-500 uppercase">Estoque</span>
                                </div>
                                <p className={`text-xs font-semibold ${isLowStock ? "text-red-700" : "text-gray-800"}`}>
                                  {produto.estoque} {isLowStock ? `(mín: ${produto.estoque_minimo})` : ""}
                                </p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-medium text-green-500 uppercase">💰 Valor</span>
                                </div>
                                <p className="text-xs font-bold text-green-700">{formatCurrency(produto.valor_unitario)}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-medium text-gray-500 uppercase">Status</span>
                                </div>
                                <Badge variant={produto.ativo ? "default" : "secondary"}
                                  className={`text-[10px] ${produto.ativo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                                  {produto.ativo ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isServico(produto.codigo)) {
                                    setEditandoServico({ id: produto.id, codigo: produto.codigo, descricao: produto.descricao, valor_mao_obra: produto.valor_mao_obra, observacoes: produto.observacoes, ativo: produto.ativo })
                                    setServicoDialogOpen(true)
                                  } else {
                                    router.push(`/produtos/${produto.id}/editar`)
                                  }
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Editar
                              </Button>
                              <ProdutoDeleteDialog produto={produto} onSuccess={() => { fetchProdutos(); fetchServicos() }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* ═══ DESKTOP VIEW — Tabela ═══ */}
            <Card className="border-0 shadow-lg bg-white hidden md:block">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Lista de Produtos</CardTitle>
                    <CardDescription className="text-green-100">
                      Gerencie todos os produtos do sistema. Códigos gerados automaticamente.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/produtos/novo")}
                    className="bg-white text-green-600 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
                  <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
                    <Search className="h-4 w-4 text-green-100 flex-shrink-0" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchProdutos}
                      onChange={(e) => setSearchProdutos(e.target.value)}
                      className="max-w-sm bg-white/10 border-white/20 text-white placeholder:text-green-100"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                      <SelectTrigger className="w-[200px] bg-white text-gray-800 border-0 h-9">
                        <SelectValue placeholder="Filtrar por Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Categorias</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                      <SelectTrigger className="w-[200px] bg-white text-gray-800 border-0 h-9">
                        <SelectValue placeholder="Filtrar por Marca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Marcas</SelectItem>
                        {marcas.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">{renderProdutoTable(filteredProdutos)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicos" className="space-y-4">
            {/* ═══ MOBILE VIEW — Cards de serviços ═══ */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="relative flex-1 mr-3">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchServicos}
                    onChange={(e) => setSearchServicos(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/produtos/servicos/novo")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white h-9 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Novo
                </Button>
              </div>

              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
                {servicos.length} serviço{servicos.length !== 1 ? "s" : ""}
              </p>

              {servicos.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">Nenhum serviço encontrado</h3>
                  <p className="text-sm text-gray-500 mb-4">Tente ajustar a busca</p>
                </div>
              ) : (
                servicos.map((servico) => {
                  const isExpanded = expandedServicoId === servico.id

                  return (
                    <div
                      key={servico.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden border-gray-200 bg-white ${
                        isExpanded ? "shadow-lg ring-1 ring-orange-200" : "shadow-sm hover:shadow-md"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedServicoId(isExpanded ? null : servico.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3"
                      >
                        {/* Ícone */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          servico.ativo ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-gray-900 truncate block">{servico.descricao}</span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-gray-500 font-mono">{servico.codigo}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 mr-1">
                          <div className="text-sm font-bold text-orange-600">{formatCurrency(servico.valor_mao_obra)}</div>
                          <Badge variant={servico.ativo ? "default" : "secondary"}
                            className={`text-[9px] px-1 py-0 h-4 ${servico.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {servico.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? "rotate-90" : ""
                        }`} />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-gray-100 pt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-orange-50 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-medium text-orange-500 uppercase">Valor Mão de Obra</span>
                                </div>
                                <p className="text-xs font-bold text-orange-700">{formatCurrency(servico.valor_mao_obra)}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-medium text-gray-500 uppercase">Observações</span>
                                </div>
                                <p className="text-xs text-gray-700 whitespace-pre-line">{servico.observacoes || "Nenhuma observação"}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditandoServico({ id: servico.id, codigo: servico.codigo, descricao: servico.descricao, valor_mao_obra: servico.valor_mao_obra, observacoes: servico.observacoes, ativo: servico.ativo })
                                  setServicoDialogOpen(true)
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Editar
                              </Button>
                              <ProdutoDeleteDialog produto={servico} onSuccess={() => { fetchProdutos(); fetchServicos() }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* ═══ DESKTOP VIEW — Tabela de serviços ═══ */}
            <Card className="border-0 shadow-lg bg-white hidden md:block">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Lista de Serviços</CardTitle>
                    <CardDescription className="text-orange-100">
                      Gerencie todos os serviços do sistema. Produtos da categoria "Serviços".
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/produtos/servicos/novo")}
                    className="bg-white text-orange-600 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Search className="h-4 w-4 text-orange-100" />
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchServicos}
                    onChange={(e) => setSearchServicos(e.target.value)}
                    className="max-w-sm bg-white/10 border-white/20 text-white placeholder:text-orange-100"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">{renderServicoTable(servicos)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Categorias de Produtos</CardTitle>
                    <CardDescription className="text-blue-100">
                      Gerencie as categorias dos produtos. Códigos gerados automaticamente (001, 002, 003...).
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/produtos/categorias/nova")}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Search className="h-4 w-4 text-blue-100" />
                  <Input
                    placeholder="Buscar categorias..."
                    value={searchCategorias}
                    onChange={(e) => setSearchCategorias(e.target.value)}
                    className="max-w-sm bg-white/10 border-white/20 text-white placeholder:text-blue-100"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">{renderCategoriaTable(categorias)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marcas" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Marcas de Produtos</CardTitle>
                    <CardDescription className="text-purple-100">
                      Gerencie as marcas dos produtos. Siglas geradas automaticamente com consoantes.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/produtos/marcas/nova")}
                    className="bg-white text-purple-600 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Marca
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Search className="h-4 w-4 text-purple-100" />
                  <Input
                    placeholder="Buscar marcas..."
                    value={searchMarcas}
                    onChange={(e) => setSearchMarcas(e.target.value)}
                    className="max-w-sm bg-white/10 border-white/20 text-white placeholder:text-purple-100"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">{renderMarcaTable(marcas)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <EditarServicoDialog
        open={servicoDialogOpen}
        onOpenChange={setServicoDialogOpen}
        servico={editandoServico}
        onSuccess={() => {
          fetchProdutos()
          fetchServicos()
        }}
      />
    </div>
  )
}
