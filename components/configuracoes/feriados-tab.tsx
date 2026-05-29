"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizableTable } from "@/components/ui/resizable-table"
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
import { Plus, Edit, Trash2, Calendar, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingFeriado, setEditingFeriado] = useState<Feriado | null>(null)
  const [feriadoParaDeletar, setFeriadoParaDeletar] = useState<Feriado | null>(null)
  const [expandedFeriadoId, setExpandedFeriadoId] = useState<number | null>(null)
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
        setEditDialogOpen(false)
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

      // Se já está no formato YYYY-MM-DD, converte diretamente sem timezone
      if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = data.split("-")
        return `${dia}/${mes}/${ano}`
      }

      // Se está no formato ISO completo, usa apenas a parte da data
      if (data.includes("T")) {
        const dateOnly = data.split("T")[0]
        const [ano, mes, dia] = dateOnly.split("-")
        return `${dia}/${mes}/${ano}`
      }

      // Para outros formatos, tenta conversão direta
      return "Data inválida"
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

      // Se está no formato ISO completo, extrai apenas a data
      if (data.includes("T")) {
        return data.split("T")[0]
      }

      // Se está no formato DD/MM/YYYY
      if (data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = data.split("/")
        return `${ano}-${mes}-${dia}`
      }

      return ""
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
          {/* DESKTOP VIEW */}
          <div className="hidden md:block">
            <ResizableTable<Feriado>
              storageKey="config-feriados"
              columns={[
                { key: "data",  label: "Data",            width: 110, sortable: true },
                { key: "nome",  label: "Nome do Feriado",  width: 250, sortable: true },
                { key: "tipo",  label: "Tipo",             width: 120, sortable: true },
                { key: "acoes", label: "Ações",           width: 100, sortable: false, noResize: true, align: "center" },
              ]}
              data={feriados}
              rowKey={(row) => row.id}
              emptyState={
                <div className="text-center py-8 text-muted-foreground">Nenhum feriado cadastrado</div>
              }
              renderCell={(feriado, col) => {
                switch (col) {
                  case "data": return <span className="font-medium">{formatarData(feriado.data)}</span>
                  case "nome": return <span>{feriado.nome}</span>
                  case "tipo": return <span>{getTipoLabel(feriado.tipo)}</span>
                  case "acoes":
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingFeriado({ ...feriado, data: formatarDataParaInput(feriado.data) })
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setFeriadoParaDeletar(feriado)
                            setDeleteConfirmOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  default: return null
                }
              }}
            />
          </div>

          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3 p-4">
            {feriados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum feriado cadastrado</div>
            ) : (
              feriados.map((feriado) => {
                const isExpanded = expandedFeriadoId === feriado.id
                return (
                  <div
                    key={feriado.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden bg-white ${
                      isExpanded ? "shadow-lg ring-1 ring-blue-200" : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFeriadoId(prev => prev === feriado.id ? null : feriado.id)}
                      className="w-full text-left p-3.5 flex items-center gap-3"
                    >
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate block">
                          {feriado.nome}
                        </span>
                        <span className="text-[11px] text-gray-500 block">
                          {formatarData(feriado.data)}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 mr-1">
                        <Badge variant="outline" className="text-[10px]">{getTipoLabel(feriado.tipo)}</Badge>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`} />
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <span className="text-[10px] font-medium text-gray-500 uppercase block mb-0.5">Data</span>
                              <p className="text-xs font-semibold text-gray-800">{formatarData(feriado.data)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <span className="text-[10px] font-medium text-gray-500 uppercase block mb-0.5">Tipo</span>
                              <p className="text-xs text-gray-800">{getTipoLabel(feriado.tipo)}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs hover:bg-blue-50 bg-white" 
                              onClick={() => {
                                setEditingFeriado({ ...feriado, data: formatarDataParaInput(feriado.data) })
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs hover:bg-red-50 text-red-600 bg-white"
                              onClick={() => {
                                setFeriadoParaDeletar(feriado)
                                setDeleteConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* SINGLE EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Feriado</DialogTitle>
            <DialogDescription>Altere os dados do feriado conforme necessário.</DialogDescription>
          </DialogHeader>
          {editingFeriado && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-data">Data</Label>
                <Input id="edit-data" type="date" value={editingFeriado.data} onChange={(e) => setEditingFeriado({ ...editingFeriado, data: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-nome">Nome do Feriado</Label>
                <Input id="edit-nome" value={editingFeriado.nome} onChange={(e) => setEditingFeriado({ ...editingFeriado, nome: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select value={editingFeriado.tipo} onValueChange={(value) => setEditingFeriado({ ...editingFeriado, tipo: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="pessoa">Pessoa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingFeriado(null); }}>Cancelar</Button>
                <Button onClick={handleEditar}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SINGLE DELETE CONFIRM DIALOG */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o feriado "{feriadoParaDeletar?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteConfirmOpen(false); setFeriadoParaDeletar(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (feriadoParaDeletar) {
                handleRemover(feriadoParaDeletar.id)
              }
              setDeleteConfirmOpen(false)
              setFeriadoParaDeletar(null)
            }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
