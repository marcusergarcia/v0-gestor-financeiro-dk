"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Cliente {
  id: number
  codigo: string
  nome: string
  endereco: string
  tem_contrato: boolean
  dia_contrato: number | null
  contrato_numero: string | null
  contrato_status: string | null
  ja_tem_os_no_mes: boolean
  os_existente?: { id: number; numero: string }
}

interface LotePreventivasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LotePreventivasDialog({ open, onOpenChange, onSuccess }: LotePreventivasDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesSelecionados, setClientesSelecionados] = useState<number[]>([])
  const [mesReferencia, setMesReferencia] = useState("")
  const [dataAgendamento, setDataAgendamento] = useState("")
  const [periodoAgendamento, setPeriodoAgendamento] = useState<"" | "manha" | "tarde" | "integral">("")
  const [etapa, setEtapa] = useState<"configuracao" | "preview" | "resultado">("configuracao")
  const [resultado, setResultado] = useState<any>(null)

  // Definir mês atual como padrão
  useEffect(() => {
    if (open) {
      const hoje = new Date()
      const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
      setMesReferencia(mesAtual)
      setEtapa("configuracao")
      setClientesSelecionados([])
      setResultado(null)
    }
  }, [open])

  // Buscar clientes quando o mês mudar
  useEffect(() => {
    if (mesReferencia && open) {
      buscarClientes()
    }
  }, [mesReferencia, open])

  const buscarClientes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ordens-servico/lote?mes=${mesReferencia}`)
      const data = await response.json()

      if (data.success) {
        setClientes(data.data)
        // Selecionar automaticamente clientes que não têm OS no mês
        const clientesElegiveis = data.data.filter((c: Cliente) => !c.ja_tem_os_no_mes).map((c: Cliente) => c.id)
        setClientesSelecionados(clientesElegiveis)
      } else {
        toast.error("Erro ao buscar clientes")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao buscar clientes")
    } finally {
      setLoading(false)
    }
  }

  const toggleCliente = (clienteId: number) => {
    setClientesSelecionados((prev) =>
      prev.includes(clienteId) ? prev.filter((id) => id !== clienteId) : [...prev, clienteId],
    )
  }

  const toggleTodos = () => {
    if (clientesSelecionados.length === clientes.filter((c) => !c.ja_tem_os_no_mes).length) {
      setClientesSelecionados([])
    } else {
      setClientesSelecionados(clientes.filter((c) => !c.ja_tem_os_no_mes).map((c) => c.id))
    }
  }

  const criarOrdens = async () => {
    if (clientesSelecionados.length === 0) {
      toast.error("Selecione pelo menos um cliente")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/ordens-servico/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientes_ids: clientesSelecionados,
          mes_referencia: mesReferencia,
          data_agendamento: dataAgendamento || null,
          periodo_agendamento: periodoAgendamento || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResultado(data.data)
        setEtapa("resultado")
        toast.success(data.message)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || "Erro ao criar ordens")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar ordens em lote")
    } finally {
      setLoading(false)
    }
  }

  const renderConfiguracao = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mes">Mês de Referência</Label>
          <Input id="mes" type="month" value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data de Agendamento (Opcional)</Label>
          <Input id="data" type="date" value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Período (Opcional)</Label>
        <Select value={periodoAgendamento} onValueChange={(v: any) => setPeriodoAgendamento(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manha">Manhã</SelectItem>
            <SelectItem value="tarde">Tarde</SelectItem>
            <SelectItem value="integral">Integral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Clientes com Contrato Ativo</Label>
          <Button variant="outline" size="sm" onClick={toggleTodos}>
            {clientesSelecionados.length === clientes.filter((c) => !c.ja_tem_os_no_mes).length
              ? "Desmarcar Todos"
              : "Selecionar Todos"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-md border p-4">
            {clientes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">Nenhum cliente com contrato encontrado</p>
            ) : (
              clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className={`flex items-start space-x-3 rounded-lg border p-3 ${
                    cliente.ja_tem_os_no_mes ? "bg-muted opacity-60" : "hover:bg-accent"
                  }`}
                >
                  <Checkbox
                    checked={clientesSelecionados.includes(cliente.id)}
                    onCheckedChange={() => toggleCliente(cliente.id)}
                    disabled={cliente.ja_tem_os_no_mes}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{cliente.nome}</p>
                      {cliente.ja_tem_os_no_mes && (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertCircle className="h-3 w-3" />
                          Já tem OS no mês ({cliente.os_existente?.numero})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{cliente.endereco}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Código: {cliente.codigo}</span>
                      {cliente.dia_contrato && <span>• Dia do Contrato: {cliente.dia_contrato}</span>}
                      {cliente.contrato_numero && <span>• Contrato: {cliente.contrato_numero}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">Selecionados: {clientesSelecionados.length} clientes</p>
          <p className="mt-1 text-xs">
            Serão criadas {clientesSelecionados.length} ordens de serviço preventivas para o mês {mesReferencia}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={criarOrdens} disabled={loading || clientesSelecionados.length === 0}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
          Criar {clientesSelecionados.length} Ordens
        </Button>
      </div>
    </div>
  )

  const renderResultado = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Ordens Criadas com Sucesso</h3>
          </div>
          <p className="mt-2 text-sm text-green-700">{resultado?.sucesso.length} ordens de serviço foram criadas</p>
        </div>

        {resultado?.sucesso.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ordens Criadas:</Label>
            <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-md border p-4">
              {resultado.sucesso.map((item: any) => (
                <div key={item.ordem_id} className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <div>
                    <p className="font-medium">{item.cliente_nome}</p>
                    <p className="text-sm text-muted-foreground">OS #{item.numero_os}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {resultado?.erros.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-red-600">Erros:</Label>
            <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border border-red-200 p-4">
              {resultado.erros.map((item: any, index: number) => (
                <div key={index} className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-900">Cliente ID: {item.cliente_id}</p>
                  <p className="text-xs text-red-700">{item.erro}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onOpenChange(false)}>Fechar</Button>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6" />
            {etapa === "configuracao" && "Criar Ordens Preventivas em Lote"}
            {etapa === "resultado" && "Resultado da Criação"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-6">
          {etapa === "configuracao" && renderConfiguracao()}
          {etapa === "resultado" && renderResultado()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
