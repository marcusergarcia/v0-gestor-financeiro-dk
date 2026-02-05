"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2, Search, FileText } from "lucide-react"

export function FiscalTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [buscandoServicos, setBuscandoServicos] = useState(false)
  const [servicosEncontrados, setServicosEncontrados] = useState<any[]>([])
  const [buscaServico, setBuscaServico] = useState("")
  const [showServicos, setShowServicos] = useState(false)
  const [config, setConfig] = useState({
    municipal_service_id: "",
    municipal_service_code: "",
    municipal_service_name: "",
    descricao_servico_padrao: "",
    iss_percentual: "5.00",
    cofins_percentual: "0.00",
    csll_percentual: "0.00",
    inss_percentual: "0.00",
    ir_percentual: "0.00",
    pis_percentual: "0.00",
    reter_iss: false,
    emissao_automatica: false,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/fiscal")
      const result = await response.json()
      if (result.success && result.data) {
        const d = result.data
        setConfig({
          municipal_service_id: d.municipal_service_id || "",
          municipal_service_code: d.municipal_service_code || "",
          municipal_service_name: d.municipal_service_name || "",
          descricao_servico_padrao: d.descricao_servico_padrao || "",
          iss_percentual: String(d.iss_percentual || "5.00"),
          cofins_percentual: String(d.cofins_percentual || "0.00"),
          csll_percentual: String(d.csll_percentual || "0.00"),
          inss_percentual: String(d.inss_percentual || "0.00"),
          ir_percentual: String(d.ir_percentual || "0.00"),
          pis_percentual: String(d.pis_percentual || "0.00"),
          reter_iss: !!d.reter_iss,
          emissao_automatica: !!d.emissao_automatica,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar config fiscal:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/configuracoes/fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          iss_percentual: Number.parseFloat(config.iss_percentual),
          cofins_percentual: Number.parseFloat(config.cofins_percentual),
          csll_percentual: Number.parseFloat(config.csll_percentual),
          inss_percentual: Number.parseFloat(config.inss_percentual),
          ir_percentual: Number.parseFloat(config.ir_percentual),
          pis_percentual: Number.parseFloat(config.pis_percentual),
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Sucesso!", description: "Configuracao fiscal salva!" })
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" })
    } finally {
      setSaving(false)
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
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao buscar servicos", variant: "destructive" })
    } finally {
      setBuscandoServicos(false)
    }
  }

  const selecionarServico = (servico: any) => {
    setConfig({
      ...config,
      municipal_service_id: servico.id,
      municipal_service_name: servico.description,
      iss_percentual: String(servico.issTax || config.iss_percentual),
    })
    setShowServicos(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-600" />
            Configuracao Fiscal (NFS-e)
          </h2>
          <p className="text-gray-600 mt-1">Configure impostos e servico padrao para NFS-e</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servico Municipal Padrao</CardTitle>
          <CardDescription>Servico principal da empresa para a prefeitura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Buscar Servico (via Asaas)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={buscaServico}
                onChange={(e) => setBuscaServico(e.target.value)}
                placeholder="Buscar... (ex: manutencao)"
                onKeyDown={(e) => e.key === "Enter" && buscarServicos()}
              />
              <Button type="button" variant="outline" onClick={buscarServicos} disabled={buscandoServicos} className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent">
                {buscandoServicos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {showServicos && servicosEncontrados.length > 0 && (
            <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
              {servicosEncontrados.map((s: any) => (
                <button key={s.id} type="button" onClick={() => selecionarServico(s)} className="w-full text-left p-3 hover:bg-orange-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">{s.description}</p>
                  <p className="text-xs text-gray-500">ID: {s.id} | ISS: {s.issTax || 0}%</p>
                </button>
              ))}
            </div>
          )}
          {config.municipal_service_name && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800">Servico selecionado:</p>
              <p className="text-sm text-orange-700">{config.municipal_service_name}</p>
              {config.municipal_service_id && <p className="text-xs text-orange-500 mt-1">ID: {config.municipal_service_id}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Codigo do Servico</Label>
              <Input value={config.municipal_service_code} onChange={(e) => setConfig({ ...config, municipal_service_code: e.target.value })} placeholder="Ex: 7.02" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Nome do Servico</Label>
              <Input value={config.municipal_service_name} onChange={(e) => setConfig({ ...config, municipal_service_name: e.target.value })} placeholder="Ex: Manutencao predial" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-700">Descricao Padrao</Label>
            <Textarea value={config.descricao_servico_padrao} onChange={(e) => setConfig({ ...config, descricao_servico_padrao: e.target.value })} placeholder="Descricao padrao..." rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Impostos Padrao</CardTitle>
          <CardDescription>Aliquotas padrao para novas NFS-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">ISS (%)</Label>
              <Input type="number" step="0.01" value={config.iss_percentual} onChange={(e) => setConfig({ ...config, iss_percentual: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">COFINS (%)</Label>
              <Input type="number" step="0.01" value={config.cofins_percentual} onChange={(e) => setConfig({ ...config, cofins_percentual: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">CSLL (%)</Label>
              <Input type="number" step="0.01" value={config.csll_percentual} onChange={(e) => setConfig({ ...config, csll_percentual: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">INSS (%)</Label>
              <Input type="number" step="0.01" value={config.inss_percentual} onChange={(e) => setConfig({ ...config, inss_percentual: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">IR (%)</Label>
              <Input type="number" step="0.01" value={config.ir_percentual} onChange={(e) => setConfig({ ...config, ir_percentual: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">PIS (%)</Label>
              <Input type="number" step="0.01" value={config.pis_percentual} onChange={(e) => setConfig({ ...config, pis_percentual: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={config.reter_iss} onCheckedChange={(v) => setConfig({ ...config, reter_iss: v })} />
            <Label className="text-sm text-gray-700">Reter ISS por padrao</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
