"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { toast } from "@/hooks/use-toast"
import { FileText, Loader2, Send, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ConfigFiscal {
  municipal_service_id?: string
  municipal_service_code?: string
  municipal_service_name?: string
  descricao_servico_padrao?: string
  iss_percentual: number
  cofins_percentual: number
  csll_percentual: number
  inss_percentual: number
  ir_percentual: number
  pis_percentual: number
  reter_iss: boolean
}

interface NovaNotaFiscalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NovaNotaFiscalDialog({ open, onOpenChange, onSuccess }: NovaNotaFiscalDialogProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [valor, setValor] = useState("")
  const [descricaoServico, setDescricaoServico] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [dataEmissao, setDataEmissao] = useState("")
  const [dataCompetencia, setDataCompetencia] = useState("")
  
  // Servico municipal
  const [municipalServiceId, setMunicipalServiceId] = useState("")
  const [municipalServiceCode, setMunicipalServiceCode] = useState("")
  const [municipalServiceName, setMunicipalServiceName] = useState("")
  const [buscandoServicos, setBuscandoServicos] = useState(false)
  const [servicosEncontrados, setServicosEncontrados] = useState<any[]>([])
  const [buscaServico, setBuscaServico] = useState("")
  const [showServicos, setShowServicos] = useState(false)
  
  // Impostos
  const [issPercentual, setIssPercentual] = useState("5.00")
  const [cofinsPercentual, setCofinsPercentual] = useState("0.00")
  const [csllPercentual, setCsllPercentual] = useState("0.00")
  const [inssPercentual, setInssPercentual] = useState("0.00")
  const [irPercentual, setIrPercentual] = useState("0.00")
  const [pisPercentual, setPisPercentual] = useState("0.00")
  const [reterIss, setReterIss] = useState(false)
  const [deducoes, setDeducoes] = useState("0.00")
  
  const [loading, setLoading] = useState(false)
  const [emitindoAsaas, setEmitindoAsaas] = useState(false)

  useEffect(() => {
    if (open) {
      setDataEmissao(new Date().toISOString().split("T")[0])
      setDataCompetencia(new Date().toISOString().split("T")[0])
      carregarConfigFiscal()
    }
  }, [open])

  const carregarConfigFiscal = async () => {
    try {
      const response = await fetch("/api/configuracoes/fiscal")
      const result = await response.json()
      if (result.success && result.data) {
        const config = result.data
        if (config.municipal_service_id) setMunicipalServiceId(config.municipal_service_id)
        if (config.municipal_service_code) setMunicipalServiceCode(config.municipal_service_code)
        if (config.municipal_service_name) setMunicipalServiceName(config.municipal_service_name)
        if (config.descricao_servico_padrao) setDescricaoServico(config.descricao_servico_padrao)
        setIssPercentual(String(config.iss_percentual || "5.00"))
        setCofinsPercentual(String(config.cofins_percentual || "0.00"))
        setCsllPercentual(String(config.csll_percentual || "0.00"))
        setInssPercentual(String(config.inss_percentual || "0.00"))
        setIrPercentual(String(config.ir_percentual || "0.00"))
        setPisPercentual(String(config.pis_percentual || "0.00"))
        setReterIss(!!config.reter_iss)
      }
    } catch (error) {
      console.error("Erro ao carregar config fiscal:", error)
    }
  }

  const buscarServicos = async () => {
    setBuscandoServicos(true)
    try {
      const params = buscaServico ? `?descricao=${encodeURIComponent(buscaServico)}` : ""
      const response = await fetch(`/api/notas-fiscais/servicos-municipais${params}`)
      const result = await response.json()
      if (result.success) {
        setServicosEncontrados(result.data || [])
        setShowServicos(true)
      } else {
        toast({
          title: "Aviso",
          description: result.message || "Nao foi possivel buscar servicos municipais",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar servicos municipais do Asaas",
        variant: "destructive",
      })
    } finally {
      setBuscandoServicos(false)
    }
  }

  const selecionarServico = (servico: any) => {
    setMunicipalServiceId(servico.id)
    setMunicipalServiceName(servico.description)
    if (servico.issTax) {
      setIssPercentual(String(servico.issTax))
    }
    setShowServicos(false)
  }

  const handleSubmit = async (emitirAsaas: boolean) => {
    if (!cliente) {
      toast({ title: "Erro", description: "Selecione um cliente", variant: "destructive" })
      return
    }
    if (!valor || Number(valor) <= 0) {
      toast({ title: "Erro", description: "Informe um valor valido", variant: "destructive" })
      return
    }
    if (!descricaoServico.trim()) {
      toast({ title: "Erro", description: "Informe a descricao do servico", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      if (emitirAsaas) setEmitindoAsaas(true)

      // 1. Criar nota fiscal no banco
      const response = await fetch("/api/notas-fiscais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: cliente.id,
          valor: Number.parseFloat(valor.replace(",", ".")),
          descricao_servico: descricaoServico,
          observacoes,
          data_emissao: dataEmissao,
          data_competencia: dataCompetencia,
          municipal_service_id: municipalServiceId || null,
          municipal_service_code: municipalServiceCode || null,
          municipal_service_name: municipalServiceName || null,
          iss_percentual: Number.parseFloat(issPercentual),
          cofins_percentual: Number.parseFloat(cofinsPercentual),
          csll_percentual: Number.parseFloat(csllPercentual),
          inss_percentual: Number.parseFloat(inssPercentual),
          ir_percentual: Number.parseFloat(irPercentual),
          pis_percentual: Number.parseFloat(pisPercentual),
          reter_iss: reterIss,
          deducoes: Number.parseFloat(deducoes.replace(",", ".")),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
        return
      }

      const notaId = result.data.id

      // 2. Se solicitou emissao no Asaas, emitir
      if (emitirAsaas) {
        const emitirResponse = await fetch(`/api/notas-fiscais/${notaId}/emitir`, {
          method: "POST",
        })
        const emitirResult = await emitirResponse.json()

        if (emitirResult.success) {
          toast({
            title: "Sucesso!",
            description: "Nota fiscal criada e enviada ao Asaas para emissao!",
          })
        } else {
          toast({
            title: "Nota criada com ressalva",
            description: `Nota salva, mas houve erro ao emitir no Asaas: ${emitirResult.message}`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Sucesso!",
          description: "Nota fiscal criada como rascunho. Voce pode emitir depois.",
        })
      }

      onSuccess()
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao criar nota fiscal", variant: "destructive" })
    } finally {
      setLoading(false)
      setEmitindoAsaas(false)
    }
  }

  const resetForm = () => {
    setCliente(null)
    setValor("")
    setDescricaoServico("")
    setObservacoes("")
    setDataEmissao("")
    setDataCompetencia("")
    setMunicipalServiceId("")
    setMunicipalServiceCode("")
    setMunicipalServiceName("")
    setServicosEncontrados([])
    setBuscaServico("")
    setShowServicos(false)
    setIssPercentual("5.00")
    setCofinsPercentual("0.00")
    setCsllPercentual("0.00")
    setInssPercentual("0.00")
    setIrPercentual("0.00")
    setPisPercentual("0.00")
    setReterIss(false)
    setDeducoes("0.00")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Nova Nota Fiscal de Servico (NFS-e)
          </DialogTitle>
          <DialogDescription className="text-orange-100">
            Preencha os dados para emitir a nota fiscal via Asaas
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 space-y-5">
            {/* Cliente */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Cliente *</Label>
              <ClienteCombobox
                value={cliente}
                onValueChange={setCliente}
                placeholder="Selecione um cliente..."
              />
              {cliente && (
                <p className="text-sm text-gray-600">
                  Selecionado: <span className="font-medium">{cliente.nome}</span>
                </p>
              )}
            </div>

            {/* Valor e Datas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Valor do Servico *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Data de Emissao *</Label>
                <Input
                  type="date"
                  value={dataEmissao}
                  onChange={(e) => setDataEmissao(e.target.value)}
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Data de Competencia</Label>
                <Input
                  type="date"
                  value={dataCompetencia}
                  onChange={(e) => setDataCompetencia(e.target.value)}
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Descricao do Servico */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Descricao do Servico *</Label>
              <Textarea
                value={descricaoServico}
                onChange={(e) => setDescricaoServico(e.target.value)}
                placeholder="Descreva o servico prestado..."
                rows={3}
                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            {/* Servico Municipal */}
            <Card className="border-gray-200">
              <CardContent className="p-4 space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Servico Municipal (Prefeitura)</Label>
                <div className="flex gap-2">
                  <Input
                    value={buscaServico}
                    onChange={(e) => setBuscaServico(e.target.value)}
                    placeholder="Buscar servico municipal... (ex: manutencao)"
                    className="flex-1 border-gray-200"
                    onKeyDown={(e) => e.key === "Enter" && buscarServicos()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={buscarServicos}
                    disabled={buscandoServicos}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                  >
                    {buscandoServicos ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {municipalServiceName && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-orange-800">Servico selecionado:</p>
                    <p className="text-sm text-orange-700">{municipalServiceName}</p>
                    {municipalServiceId && (
                      <p className="text-xs text-orange-500 mt-1">ID: {municipalServiceId}</p>
                    )}
                  </div>
                )}

                {showServicos && servicosEncontrados.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {servicosEncontrados.map((servico: any) => (
                      <button
                        key={servico.id}
                        type="button"
                        onClick={() => selecionarServico(servico)}
                        className="w-full text-left p-3 hover:bg-orange-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900">{servico.description}</p>
                        <p className="text-xs text-gray-500">
                          ID: {servico.id} | ISS: {servico.issTax || 0}%
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {showServicos && servicosEncontrados.length === 0 && !buscandoServicos && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Nenhum servico encontrado. Tente outra busca ou informe manualmente.
                  </p>
                )}

                {/* Campos manuais */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Codigo do Servico</Label>
                    <Input
                      value={municipalServiceCode}
                      onChange={(e) => setMunicipalServiceCode(e.target.value)}
                      placeholder="Ex: 7.02"
                      className="text-sm border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Nome do Servico</Label>
                    <Input
                      value={municipalServiceName}
                      onChange={(e) => setMunicipalServiceName(e.target.value)}
                      placeholder="Ex: Manutencao predial"
                      className="text-sm border-gray-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impostos */}
            <Card className="border-gray-200">
              <CardContent className="p-4 space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Impostos</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">ISS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={issPercentual}
                      onChange={(e) => setIssPercentual(e.target.value)}
                      className="text-sm border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">COFINS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cofinsPercentual}
                      onChange={(e) => setCofinsPercentual(e.target.value)}
                      className="text-sm border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">CSLL (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={csllPercentual}
                      onChange={(e) => setCsllPercentual(e.target.value)}
                      className="text-sm border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">INSS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={inssPercentual}
                      onChange={(e) => setInssPercentual(e.target.value)}
                      className="text-sm border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">IR (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={irPercentual}
                      onChange={(e) => setIrPercentual(e.target.value)}
                      className="text-sm border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">PIS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pisPercentual}
                      onChange={(e) => setPisPercentual(e.target.value)}
                      className="text-sm border-gray-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={reterIss}
                      onCheckedChange={setReterIss}
                    />
                    <Label className="text-sm text-gray-700">Reter ISS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-600">Deducoes (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={deducoes}
                      onChange={(e) => setDeducoes(e.target.value)}
                      className="w-32 text-sm border-gray-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observacoes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Observacoes</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observacoes adicionais..."
                rows={2}
                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        {/* Footer com acoes */}
        <div className="border-t bg-gray-50 p-4 flex justify-between items-center flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false) }}
            className="border-gray-200 bg-transparent"
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
            >
              {loading && !emitindoAsaas ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
            >
              {emitindoAsaas ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Emitir NFS-e no Asaas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
