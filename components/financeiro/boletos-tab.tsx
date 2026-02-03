"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Edit, Trash2, Plus, Search, Filter, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { NovoBoletoDiaolog } from "./novo-boleto-dialog"
import { EditarBoletoDialog } from "./editar-boleto-dialog"
import { PreviewParcelasDialog } from "./preview-parcelas-dialog"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  status: "pendente" | "aguardando_pagamento" | "pago" | "vencido" | "cancelado"
  parcela_atual: number
  total_parcelas: number
  observacoes?: string
  created_at: string
}

export function BoletosTab() {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [novoBoletoDiaolog, setNovoBoletoDiaolog] = useState(false)
  const [editarBoleto, setEditarBoleto] = useState<Boleto | null>(null)
  const [previewParcelas, setPreviewParcelas] = useState<any>(null)

  const fetchBoletos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/boletos")
      if (response.ok) {
        const data = await response.json()
        setBoletos(data)
      }
    } catch (error) {
      console.error("Erro ao carregar boletos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar boletos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoletos()
  }, [])

  const handleDeleteBoleto = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este boleto?")) return

    try {
      const response = await fetch(`/api/boletos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Boleto excluído com sucesso",
        })
        fetchBoletos()
      } else {
        throw new Error("Erro ao excluir boleto")
      }
    } catch (error) {
      console.error("Erro ao excluir boleto:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir boleto",
        variant: "destructive",
      })
    }
  }

  const handleMarcarPago = async (id: number) => {
    if (!confirm("⚠️ TESTE: Marcar este boleto como PAGO manualmente?")) return

    try {
      const response = await fetch(`/api/boletos/${id}/marcar-pago`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sucesso (TESTE)",
          description: `Boleto ${data.numero_boleto} marcado como pago`,
        })
        fetchBoletos()
      } else {
        throw new Error("Erro ao marcar boleto como pago")
      }
    } catch (error) {
      console.error("Erro ao marcar boleto como pago:", error)
      toast({
        title: "Erro",
        description: "Erro ao marcar boleto como pago",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", variant: "secondary" as const },
      aguardando_pagamento: { label: "Aguardando", variant: "default" as const },
      pago: { label: "Pago", variant: "default" as const },
      vencido: { label: "Vencido", variant: "destructive" as const },
      cancelado: { label: "Cancelado", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredBoletos = boletos.filter((boleto) => {
    const matchesSearch =
      boleto.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.numero.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "todos" || boleto.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Boletos</h2>
          <p className="text-muted-foreground">Gerencie todos os boletos emitidos</p>
        </div>
        <Button onClick={() => setNovoBoletoDiaolog(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Boleto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar boletos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Boletos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Boletos</CardTitle>
          <CardDescription>{filteredBoletos.length} boletos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando boletos...</div>
          ) : filteredBoletos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum boleto encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoletos.map((boleto) => (
                  <TableRow key={boleto.id}>
                    <TableCell className="font-medium">{boleto.numero}</TableCell>
                    <TableCell>{boleto.cliente_nome}</TableCell>
                    <TableCell>{formatCurrency(boleto.valor)}</TableCell>
                    <TableCell>{formatDate(boleto.data_vencimento)}</TableCell>
                    <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                    <TableCell>
                      {boleto.parcela_atual}/{boleto.total_parcelas}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewParcelas(boleto)} title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditarBoleto(boleto)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {boleto.status === "pendente" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarcarPago(boleto.id)}
                            title="Marcar como Pago (TESTE)"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBoleto(boleto.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialogs */}
      <NovoBoletoDiaolog open={novoBoletoDiaolog} onOpenChange={setNovoBoletoDiaolog} onSuccess={fetchBoletos} />

      {editarBoleto && (
        <EditarBoletoDialog
          boleto={editarBoleto}
          open={!!editarBoleto}
          onOpenChange={(open) => !open && setEditarBoleto(null)}
          onSuccess={fetchBoletos}
        />
      )}

      {previewParcelas && (
        <PreviewParcelasDialog
          boleto={previewParcelas}
          open={!!previewParcelas}
          onOpenChange={(open) => !open && setPreviewParcelas(null)}
        />
      )}
    </div>
  )
}
