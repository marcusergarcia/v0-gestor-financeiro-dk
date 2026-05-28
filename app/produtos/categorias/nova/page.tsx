"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NovaCategoriaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [previewCodigo, setPreviewCodigo] = useState("")
  const [formData, setFormData] = useState({
    nome: "",
    ativo: true,
  })

  const generatePreviewCodigo = async () => {
    try {
      const response = await fetch("/api/categorias/proximo-codigo")
      const result = await response.json()
      if (result.success) {
        setPreviewCodigo(result.codigo)
      }
    } catch (error) {
      console.error("Erro ao gerar preview do código:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Categoria criada com sucesso!",
          description: `Categoria "${formData.nome}" foi cadastrada.`,
        })
        router.push("/produtos")
      } else {
        toast({
          title: "Erro ao criar categoria",
          description: result.message || "Ocorreu um erro inesperado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast({
        title: "Erro ao criar categoria",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "nome" && value && !previewCodigo) {
      generatePreviewCodigo()
    }
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
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Nova Categoria
            </h2>
            <p className="text-gray-600 mt-1">Cadastre uma nova categoria de produto</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white">Informações da Categoria</CardTitle>
                  <CardDescription className="text-green-100">
                    Preencha os dados da nova categoria. O código será gerado automaticamente.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {previewCodigo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Tag className="h-4 w-4" />
                      <span className="font-medium">Código que será gerado:</span>
                      <span className="font-mono font-bold">{previewCodigo}</span>
                    </div>
                  </div>
                )}

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
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Categoria
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
