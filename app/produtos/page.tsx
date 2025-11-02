"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Package, Tag, Award, Edit, Plus, AlertTriangle, CheckCircle, Wrench } from "lucide-react"
import { ProdutoDeleteDialog } from "@/components/produto-delete-dialog"
import { CategoriaDeleteDialog } from "@/components/categoria-delete-dialog"
import { MarcaDeleteDialog } from "@/components/marca-delete-dialog"
import { EditarServicoDialog } from "@/components/editar-servico-dialog"
import { formatCurrency } from "@/lib/utils"

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
      const response = await fetch(`/api/produtos?search=${searchProdutos}&limit=50`)
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
      const response = await fetch(`/api/produtos?search=${searchServicos}&categoria=serviços&limit=50`)
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
      const response = await fetch(`/api/categorias?search=${searchCategorias}&limit=50`)
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
      const response = await fetch(`/api/marcas?search=${searchMarcas}&limit=50`)
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

  const renderProdutoTable = (produtosList: Produto[]) => (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold w-[100px]">Código</TableHead>
            <TableHead className="font-semibold w-[90px]">NCM</TableHead>
            <TableHead className="font-semibold min-w-[200px]">Descrição</TableHead>
            <TableHead className="font-semibold w-[120px]">Categoria</TableHead>
            <TableHead className="font-semibold w-[110px]">Marca</TableHead>
            <TableHead className="font-semibold w-[100px]">Valor</TableHead>
            <TableHead className="font-semibold w-[110px]">Estoque</TableHead>
            <TableHead className="font-semibold w-[80px]">Status</TableHead>
            <TableHead className="text-right font-semibold w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtosList.map((produto) => (
            <TableRow key={produto.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-mono text-xs">
                <Badge variant="outline" className="font-mono text-xs">
                  {produto.codigo}
                </Badge>
              </TableCell>
              <TableCell>
                {produto.ncm ? (
                  <Badge className="bg-purple-100 text-purple-800 font-mono text-[10px]">{produto.ncm}</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-300 text-[10px]">
                    Sem NCM
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium text-sm max-w-[200px] truncate" title={produto.descricao}>
                {produto.descricao}
              </TableCell>
              <TableCell>
                {produto.categoria_nome && produto.categoria_nome !== "0" ? (
                  <Badge
                    className="bg-blue-100 text-blue-800 text-xs truncate max-w-[110px]"
                    title={produto.categoria_nome}
                  >
                    {produto.categoria_nome}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                    Sem cat.
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {produto.marca_nome && produto.marca_nome !== "0" ? (
                  <Badge
                    className="bg-green-100 text-green-800 text-xs truncate max-w-[100px]"
                    title={produto.marca_nome}
                  >
                    {produto.marca_nome}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                    Sem marca
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-semibold text-green-600 text-sm">
                {formatCurrency(produto.valor_unitario)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">{produto.estoque}</span>
                  {produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0 ? (
                    <Badge className="bg-red-100 text-red-800 animate-pulse text-[10px] px-1">
                      <AlertTriangle className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 text-[10px] px-1">
                      <CheckCircle className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={produto.ativo ? "default" : "secondary"}
                  className={`text-xs ${produto.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {produto.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isServico(produto.codigo)) {
                        setEditandoServico({
                          id: produto.id,
                          codigo: produto.codigo,
                          descricao: produto.descricao,
                          valor_mao_obra: produto.valor_mao_obra,
                          observacoes: produto.observacoes,
                          ativo: produto.ativo,
                        })
                        setServicoDialogOpen(true)
                      } else {
                        router.push(`/produtos/${produto.id}/editar`)
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <ProdutoDeleteDialog
                    produto={produto}
                    onSuccess={() => {
                      fetchProdutos()
                      fetchServicos()
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {produtosList.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro produto</p>
                <Button
                  onClick={() => router.push("/produtos/novo")}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Produto
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderServicoTable = (servicosList: Produto[]) => (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold w-[100px]">Código</TableHead>
            <TableHead className="font-semibold min-w-[250px]">Descrição</TableHead>
            <TableHead className="font-semibold w-[120px]">Categoria</TableHead>
            <TableHead className="font-semibold w-[140px]">Valor Mão de Obra</TableHead>
            <TableHead className="font-semibold w-[80px]">Status</TableHead>
            <TableHead className="text-right font-semibold w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicosList.map((servico) => (
            <TableRow key={servico.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-mono text-xs">
                <Badge variant="outline" className="font-mono text-xs">
                  {servico.codigo}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-sm max-w-[250px] truncate" title={servico.descricao}>
                {servico.descricao}
              </TableCell>
              <TableCell>
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Serviços
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-orange-600 text-sm">
                {formatCurrency(servico.valor_mao_obra)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={servico.ativo ? "default" : "secondary"}
                  className={`text-xs ${servico.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {servico.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditandoServico({
                        id: servico.id,
                        codigo: servico.codigo,
                        descricao: servico.descricao,
                        valor_mao_obra: servico.valor_mao_obra,
                        observacoes: servico.observacoes,
                        ativo: servico.ativo,
                      })
                      setServicoDialogOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <ProdutoDeleteDialog
                    produto={servico}
                    onSuccess={() => {
                      fetchProdutos()
                      fetchServicos()
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {servicosList.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <Wrench className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço encontrado</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando seu primeiro serviço</p>
                <Button
                  onClick={() => router.push("/produtos/servicos/novo")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Serviço
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderCategoriaTable = (categoriasList: Categoria[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold w-[100px]">Código</TableHead>
            <TableHead className="font-semibold min-w-[200px]">Nome</TableHead>
            <TableHead className="font-semibold w-[100px]">Status</TableHead>
            <TableHead className="text-right font-semibold w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoriasList.map((categoria) => (
            <TableRow key={categoria.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-mono font-medium">
                <Badge variant="outline" className="font-mono">
                  {categoria.codigo}
                </Badge>
              </TableCell>
              <TableCell className="font-medium max-w-[200px] truncate" title={categoria.nome}>
                {categoria.nome}
              </TableCell>
              <TableCell>
                <Badge
                  variant={categoria.ativo ? "default" : "secondary"}
                  className={`text-xs ${categoria.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {categoria.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/produtos/categorias/${categoria.id}/editar`)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <CategoriaDeleteDialog categoria={categoria} onSuccess={fetchCategorias} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {categoriasList.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12">
                <Tag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando sua primeira categoria</p>
                <Button
                  onClick={() => router.push("/produtos/categorias/nova")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Categoria
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderMarcaTable = (marcasList: Marca[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold min-w-[200px]">Nome</TableHead>
            <TableHead className="font-semibold w-[100px]">Sigla</TableHead>
            <TableHead className="font-semibold w-[100px]">Contador</TableHead>
            <TableHead className="font-semibold w-[100px]">Status</TableHead>
            <TableHead className="text-right font-semibold w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {marcasList.map((marca) => (
            <TableRow key={marca.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-medium max-w-[200px] truncate" title={marca.nome}>
                {marca.nome}
              </TableCell>
              <TableCell className="font-mono">
                {marca.sigla ? (
                  <Badge variant="outline" className="font-mono">
                    {marca.sigla}
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className="bg-purple-100 text-purple-800 text-xs">{marca.contador}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={marca.ativo ? "default" : "secondary"}
                  className={`text-xs ${marca.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {marca.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/produtos/marcas/${marca.id}/editar`)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 bg-transparent h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <MarcaDeleteDialog marca={marca} onSuccess={fetchMarcas} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {marcasList.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma marca encontrada</h3>
                <p className="text-gray-600 mb-4">Comece cadastrando sua primeira marca</p>
                <Button
                  onClick={() => router.push("/produtos/marcas/nova")}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Marca
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
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
            <Card className="border-0 shadow-lg bg-white">
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
                <div className="flex items-center space-x-2 mt-4">
                  <Search className="h-4 w-4 text-green-100" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchProdutos}
                    onChange={(e) => setSearchProdutos(e.target.value)}
                    className="max-w-sm bg-white/10 border-white/20 text-white placeholder:text-green-100"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">{renderProdutoTable(produtos)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicos" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white">
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
