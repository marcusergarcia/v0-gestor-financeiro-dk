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
import { Plus, Edit, Trash2, Save } from "lucide-react"
import { toast } from "sonner"

interface VisitaConfig {
  quantidade_visitas: number
  percentual_desconto: number
}

export function VisitasTab() {
  const [configs, setConfigs] = useState<VisitaConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [novaConfig, setNovaConfig] = useState({
    quantidade_visitas: 1,
    percentual_desconto: 0,
  })

  useEffect(() => {
    carregarConfigs()
  }, [])

  const carregarConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/visitas-tecnicas")
      const data = await response.json()

      console.log("Dados carregados:", data)

      if (data.success) {
        setConfigs(data.data || [])
      } else {
        console.error("Erro na resposta:", data)
        toast.error("Erro ao carregar configurações")
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const salvarConfigs = async (novasConfigs: VisitaConfig[]) => {
    try {
      setSaving(true)

      console.log("Salvando configurações:", novasConfigs)

      const response = await fetch("/api/configuracoes/visitas-tecnicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: novasConfigs }),
      })

      const data = await response.json()
      console.log("Resposta do servidor:", data)

      if (data.success) {
        toast.success("Configurações salvas com sucesso!")
        await carregarConfigs() // Recarregar dados do servidor
        return true
      } else {
        console.error("Erro na resposta:", data)
        toast.error(data.error || "Erro ao salvar configurações")
        return false
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configurações")
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleAdicionar = async () => {
    // Validações
    if (novaConfig.quantidade_visitas < 1) {
      toast.error("Quantidade de visitas deve ser maior que zero")
      return
    }

    if (novaConfig.percentual_desconto < 0 || novaConfig.percentual_desconto > 100) {
      toast.error("Percentual de desconto deve estar entre 0 e 100")
      return
    }

    // Verificar se já existe configuração para esta quantidade
    if (configs.some((config) => config.quantidade_visitas === novaConfig.quantidade_visitas)) {
      toast.error("Já existe uma configuração para esta quantidade de visitas")
      return
    }

    const novasConfigs = [...configs, novaConfig].sort((a, b) => a.quantidade_visitas - b.quantidade_visitas)

    const sucesso = await salvarConfigs(novasConfigs)
    if (sucesso) {
      setDialogOpen(false)
      setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
    }
  }

  const getProximaQuantidade = () => {
    if (configs.length === 0) return 1
    const maxQuantidade = Math.max(...configs.map((c) => c.quantidade_visitas))
    return maxQuantidade + 1
  }

  const handleEditar = (index: number) => {
    setEditingIndex(index)
    setNovaConfig(configs[index])
    setDialogOpen(true)
  }

  const handleSalvarEdicao = async () => {
    if (editingIndex === null) return

    // Validações
    if (novaConfig.quantidade_visitas < 1) {
      toast.error("Quantidade de visitas deve ser maior que zero")
      return
    }

    if (novaConfig.percentual_desconto < 0 || novaConfig.percentual_desconto > 100) {
      toast.error("Percentual de desconto deve estar entre 0 e 100")
      return
    }

    // Verificar se já existe outra configuração com a mesma quantidade (exceto a atual)
    const existeOutra = configs.some(
      (config, index) => index !== editingIndex && config.quantidade_visitas === novaConfig.quantidade_visitas,
    )

    if (existeOutra) {
      toast.error("Já existe uma configuração para esta quantidade de visitas")
      return
    }

    const novasConfigs = [...configs]
    novasConfigs[editingIndex] = novaConfig
    novasConfigs.sort((a, b) => a.quantidade_visitas - b.quantidade_visitas)

    const sucesso = await salvarConfigs(novasConfigs)
    if (sucesso) {
      setDialogOpen(false)
      setEditingIndex(null)
      setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
    }
  }

  const handleRemover = async (index: number) => {
    const novasConfigs = configs.filter((_, i) => i !== index)
    const sucesso = await salvarConfigs(novasConfigs)
    if (sucesso) {
      toast.success("Configuração removida com sucesso!")
    }
  }

  const fecharDialog = () => {
    setDialogOpen(false)
    setEditingIndex(null)
    setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">📋 Visitas Técnicas</h2>
          <p className="text-muted-foreground">Configure os percentuais de desconto por quantidade de visitas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditingIndex(null)
                setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIndex !== null ? "Editar Configuração" : "Adicionar Configuração"}</DialogTitle>
              <DialogDescription>
                {editingIndex !== null
                  ? "Edite os dados da configuração de visita técnica."
                  : "Adicione uma nova configuração de desconto por quantidade de visitas."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantidade">Quantidade de Visitas</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={novaConfig.quantidade_visitas}
                  onChange={(e) =>
                    setNovaConfig({
                      ...novaConfig,
                      quantidade_visitas: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="percentual">Percentual de Desconto (%)</Label>
                <Input
                  id="percentual"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={novaConfig.percentual_desconto}
                  onChange={(e) =>
                    setNovaConfig({
                      ...novaConfig,
                      percentual_desconto: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={fecharDialog}>
                  Cancelar
                </Button>
                <Button onClick={editingIndex !== null ? handleSalvarEdicao : handleAdicionar} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingIndex !== null ? "Salvar" : "Adicionar"}
                    </>
                  )}
                </Button>
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
                <TableHead>Quantidade de Visitas</TableHead>
                <TableHead>Percentual de Desconto</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhuma configuração encontrada
                    <br />
                    <span className="text-sm">Clique em "Adicionar" para criar sua primeira configuração</span>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config, index) => (
                  <TableRow key={`${config.quantidade_visitas}-${index}`}>
                    <TableCell className="font-medium">
                      {config.quantidade_visitas} {config.quantidade_visitas === 1 ? "visita" : "visitas"}
                    </TableCell>
                    <TableCell className="text-blue-600 font-medium">{config.percentual_desconto}%</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditar(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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
                                Tem certeza que deseja remover a configuração para {config.quantidade_visitas}{" "}
                                {config.quantidade_visitas === 1 ? "visita" : "visitas"}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemover(index)}>Remover</AlertDialogAction>
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

      {configs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Como funciona:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• O desconto é aplicado automaticamente nos orçamentos</li>
              <li>• Baseado na quantidade de visitas técnicas necessárias</li>
              <li>• Percentual aplicado sobre o valor total dos equipamentos</li>
              <li>• Cada quantidade de visitas pode ter apenas um percentual</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
