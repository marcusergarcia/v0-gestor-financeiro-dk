"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Feriado {
  id: number
  data: string
  nome: string
  tipo: string
  recorrente: boolean
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export function FeriadosTab() {
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFeriado, setEditingFeriado] = useState<Feriado | null>(null)
  const [novoFeriado, setNovoFeriado] = useState({
    data: "",
    nome: "",
    tipo: "nacional",
    recorrente: true,
  })

  useEffect(() => {
    carregarFeriados()
  }, [])

  const carregarFeriados = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/feriados")
      const data = await response.json()

      if (data.success) {
        setFeriados(data.data || [])
      } else {
        toast.error("Erro ao carregar feriados")
      }
    } catch (error) {
      console.error("Erro ao carregar feriados:", error)
      toast.error("Erro ao carregar feriados")
    } finally {
      setLoading(false)
    }
  }

  const handleAdicionar = async () => {
    try {
      if (!novoFeriado.data || !novoFeriado.nome) {
        toast.error("Data e nome são obrigatórios")
        return
      }

      const response = await fetch("/api/configuracoes/feriados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoFeriado),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Feriado adicionado com sucesso!")
        setDialogOpen(false)
        setNovoFeriado({ data: "", nome: "", tipo: "nacional", recorrente: true })
        carregarFeriados()
      } else {
        toast.error(data.error || "Erro ao adicionar feriado")
      }
    } catch (error) {
      console.error("Erro ao adicionar:", error)
      toast.error("Erro ao adicionar feriado")
    }
  }

  const handleEditar = async () => {
    try {
      if (!editingFeriado || !editingFeriado.data || !editingFeriado.nome) {
        toast.error("Data e nome são obrigatórios")
        return
      }

      const response = await fetch("/api/configuracoes/feriados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFeriado),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Feriado atualizado com sucesso!")
        setEditingFeriado(null)
        carregarFeriados()
      } else {
        toast.error(data.error || "Erro ao atualizar feriado")
      }
    } catch (error) {
      console.error("Erro ao editar:", error)
      toast.error("Erro ao editar feriado")
    }
  }

  const handleRemover = async (id: number) => {
    try {
      const response = await fetch(`/api/configuracoes/feriados?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Feriado removido com sucesso!")
        carregarFeriados()
      } else {
        toast.error(data.error || "Erro ao remover feriado")
      }
    } catch (error) {
      console.error("Erro ao remover:", error)
      toast.error("Erro ao remover feriado")
    }
  }

  const formatarData = (data: string) => {
    try {
      if (!data) return "Data inválida"

      // Se já está no formato YYYY-MM-DD, converte para exibição
      if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = data.split("-")
        return `${dia}/${mes}/${ano}`
      }

      // Se está no formato ISO completo
      if (data.includes("T")) {
        const date = new Date(data)
        if (isNaN(date.getTime())) return "Data inválida"
        return date.toLocaleDateString("pt-BR")
      }

      // Tenta criar data diretamente
      const date = new Date(data + "T00:00:00")
      if (isNaN(date.getTime())) return "Data inválida"
      return date.toLocaleDateString("pt-BR")
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Data inválida"
    }
  }

  const formatarDataParaInput = (data: string) => {
    try {
      if (!data) return ""

      // Se já está no formato YYYY-MM-DD, retorna como está
      if (data.match(/^\d{4}-\d{2}-\d{2}$/)) return data

      // Se está no formato ISO completo
      if (data.includes("T")) {
        const date = new Date(data)
        if (isNaN(date.getTime())) return ""
        return date.toISOString().split("T")[0]
      }

      // Se está no formato DD/MM/YYYY
      if (data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = data.split("/")
        return `${ano}-${mes}-${dia}`
      }

      // Tenta criar data e converter
      const date = new Date(data)
      if (isNaN(date.getTime())) return ""
      return date.toISOString().split("T")[0]
    } catch (error) {
      console.error("Erro ao formatar data para input:", error)
      return ""
    }
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      nacional: "Nacional",
      estadual: "Estadual",
      municipal: "Municipal",
      pessoa: "Pessoa",
    }
    return tipos[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Calendar className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando feriados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Feriados
          </h2>
          <p className="text-muted-foreground">Gerencie os feriados do ano</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Feriado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Feriado</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo feriado que será adicionado ao calendário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={novoFeriado.data}
                  onChange={(e) => setNovoFeriado({ ...novoFeriado, data: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome do Feriado</Label>
                <Input
                  id="nome"
                  value={novoFeriado.nome}
                  onChange={(e) => setNovoFeriado({ ...novoFeriado, nome: e.target.value })}
                  placeholder="Ex: Dia do Trabalhador"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={novoFeriado.tipo}
                  onValueChange={(value) => setNovoFeriado({ ...novoFeriado, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="pessoa">Pessoa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionar}>Adicionar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome do Feriado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feriados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum feriado cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                feriados.map((feriado) => (
                  <TableRow key={feriado.id}>
                    <TableCell className="font-medium">{formatarData(feriado.data)}</TableCell>
                    <TableCell>{feriado.nome}</TableCell>
                    <TableCell>{getTipoLabel(feriado.tipo)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Dialog
                          open={editingFeriado?.id === feriado.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingFeriado(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingFeriado({
                                  ...feriado,
                                  data: formatarDataParaInput(feriado.data),
                                })
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Feriado</DialogTitle>
                              <DialogDescription>Altere os dados do feriado conforme necessário.</DialogDescription>
                            </DialogHeader>
                            {editingFeriado && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-data">Data</Label>
                                  <Input
                                    id="edit-data"
                                    type="date"
                                    value={editingFeriado.data}
                                    onChange={(e) => setEditingFeriado({ ...editingFeriado, data: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-nome">Nome do Feriado</Label>
                                  <Input
                                    id="edit-nome"
                                    value={editingFeriado.nome}
                                    onChange={(e) => setEditingFeriado({ ...editingFeriado, nome: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-tipo">Tipo</Label>
                                  <Select
                                    value={editingFeriado.tipo}
                                    onValueChange={(value) => setEditingFeriado({ ...editingFeriado, tipo: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="nacional">Nacional</SelectItem>
                                      <SelectItem value="estadual">Estadual</SelectItem>
                                      <SelectItem value="municipal">Municipal</SelectItem>
                                      <SelectItem value="pessoa">Pessoa</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditingFeriado(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleEditar}>Salvar</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o feriado "{feriado.nome}"? Esta ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemover(feriado.id)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
