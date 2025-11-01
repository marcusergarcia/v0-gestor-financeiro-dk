"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Tag, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Categoria {
  id: string
  codigo: string
  nome: string
  total_produtos: number
  ativo: boolean
}

export default function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [categoryId, setCategoryId] = useState<string>("")
  const [formData, setFormData] = useState({
    nome: "",
    ativo: true,
  })

  useEffect(() => {
    const initializePage = async () => {
      try {
        const resolvedParams = await params
        setCategoryId(resolvedParams.id)
        await fetchCategoria(resolvedParams.id)
      } catch (error) {
        console.error("Erro ao inicializar página:", error)
        router.push("/produtos")
      }
    }

    initializePage()
  }, [params, router])

  const fetchCategoria = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/categorias/${id}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setCategoria(result.data)
        setFormData({
          nome: result.data.nome,
          ativo: result.data.ativo,
        })
      } else {
        toast({
          title: "Erro",
          description: "Categoria não encontrada.",
          variant: "destructive",
        })
        router.push("/produtos")
      }
    } catch (error) {
      console.error("Erro ao buscar categoria:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar categoria.",
        variant: "destructive",
      })
      router.push("/produtos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/categorias/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Categoria "${formData.nome}" foi atualizada.`,
        })
        router.push("/produtos")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar categoria.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex-1 space-y-4 p-4 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando categoria...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!categoria) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex-1 space-y-4 p-4 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600">Categoria não encontrada</p>
              <Button onClick={() => router.push("/produtos")} className="mt-4">
                Voltar para Produtos
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-right">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Editar Categoria
            </h2>
            <p className="text-gray-600 mt-1">Atualize as informações da categoria</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white">Informações da Categoria</CardTitle>
                  <CardDescription className="text-blue-100">
                    Atualize os dados da categoria. O código não pode ser alterado.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">Código:</span>
                    <Badge variant="outline" className="font-mono">
                      {categoria.codigo}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Produtos:</span>
                    <Badge className="bg-blue-100 text-blue-800">{categoria.total_produtos}</Badge>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                    Nome da Categoria *
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Ex: Eletrônicos, Roupas, Livros..."
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <p className="text-sm text-gray-500">Categoria ativa pode ser usada em produtos</p>
                  </div>
                  <Switch checked={formData.ativo} onCheckedChange={(checked) => handleInputChange("ativo", checked)} />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !formData.nome.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
