"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Equipamento {
  id: number
  nome: string
  categoria: string
  valor_hora: number
  descricao?: string
  ativo: boolean
}

const CATEGORIAS = [
  { value: "basicos", label: "Básicos" },
  { value: "portoes_veiculos", label: "Portões de Veículos" },
  { value: "portoes_pedestre", label: "Portões de Pedestre" },
  { value: "software_redes", label: "Software e Redes" },
]

export function EquipamentosTab() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "basicos",
    valor_hora: "",
    descricao: "",
  })

  useEffect(() => {
    carregarEquipamentos()
  }, [])

  const carregarEquipamentos = async () => {
    try {
      const response = await fetch("/api/configuracoes/equipamentos")
      if (response.ok) {
        const data = await response.json()
        setEquipamentos(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      toast.error("Erro ao carregar equipamentos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.categoria || !formData.valor_hora) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      const url = editingEquipamento
        ? `/api/configuracoes/equipamentos/${editingEquipamento.id}`
        : "/api/configuracoes/equipamentos"

      const method = editingEquipamento ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          categoria: formData.categoria,
          valor_hora: Number.parseFloat(formData.valor_hora),
          descricao: formData.descricao || null,
        }),
      })

      if (response.ok) {
        toast.success(editingEquipamento ? "Equipamento atualizado!" : "Equipamento criado!")
        setDialogOpen(false)
        resetForm()
        carregarEquipamentos()
      } else {
        toast.error("Erro ao salvar equipamento")
      }
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      toast.error("Erro ao salvar equipamento")
    }
  }

  const handleEdit = (equipamento: Equipamento) => {
    setEditingEquipamento(equipamento)
    setFormData({
      nome: equipamento.nome,
      categoria: equipamento.categoria,
      valor_hora: equipamento.valor_hora.toString(),
      descricao: equipamento.descricao || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este equipamento?")) {
      return
    }

    try {
      const response = await fetch(`/api/configuracoes/equipamentos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Equipamento excluído!")
        carregarEquipamentos()
      } else {
        toast.error("Erro ao excluir equipamento")
      }
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error)
      toast.error("Erro ao excluir equipamento")
    }
  }

  const resetForm = () => {
    setFormData({ nome: "", categoria: "basicos", valor_hora: "", descricao: "" })
    setEditingEquipamento(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS.find((c) => c.value === categoria)
    return cat ? cat.label : categoria
  }

  if (loading) {
    return <div>Carregando equipamentos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Equipamentos</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEquipamento ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
              <DialogDescription>
                {editingEquipamento
                  ? "Altere as informações do equipamento abaixo."
                  : "Preencha as informações para criar um novo equipamento."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Equipamento *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Sistema de Interfones"
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((categoria) => (
                      <SelectItem key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valor_hora">Valor por Hora (R$) *</Label>
                <Input
                  id="valor_hora"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_hora}
                  onChange={(e) => setFormData({ ...formData, valor_hora: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional do equipamento"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingEquipamento ? "Atualizar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {equipamentos.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhum equipamento cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor por Hora</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentos
                  .filter((eq) => eq.ativo)
                  .map((equipamento) => (
                    <TableRow key={equipamento.id}>
                      <TableCell className="font-medium">{equipamento.nome}</TableCell>
                      <TableCell>{getCategoriaLabel(equipamento.categoria)}</TableCell>
                      <TableCell>{formatCurrency(equipamento.valor_hora)}</TableCell>
                      <TableCell className="max-w-xs truncate">{equipamento.descricao || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(equipamento)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(equipamento.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
