"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calculator, MapPin, FileText, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface ValorKmConfig {
  id?: number
  valor_por_km: number
  descricao?: string
  aplicacao?: string
}

export function ValorKmTab() {
  const [config, setConfig] = useState<ValorKmConfig>({
    valor_por_km: 1.5,
    descricao: "",
    aplicacao: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [distanciaExemplo, setDistanciaExemplo] = useState(10)
  const [duracaoExemplo, setDuracaoExemplo] = useState(1)

  useEffect(() => {
    carregarConfig()
  }, [])

  const carregarConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/valor-km")
      const data = await response.json()

      if (data.success && data.data) {
        setConfig({
          id: data.data.id,
          valor_por_km: Number(data.data.valor_por_km) || 1.5,
          descricao: data.data.descricao || "",
          aplicacao: data.data.aplicacao || "",
        })
      } else {
        setConfig({
          valor_por_km: 1.5,
          descricao: "Valor padrão por quilômetro",
          aplicacao: "Usado em orçamentos e contratos",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      toast.error("Erro ao carregar configuração")
      setConfig({
        valor_por_km: 1.5,
        descricao: "Valor padrão por quilômetro",
        aplicacao: "Usado em orçamentos e contratos",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async () => {
    try {
      setSaving(true)

      if (!config.valor_por_km || config.valor_por_km <= 0) {
        toast.error("Valor por KM deve ser maior que zero")
        return
      }

      const response = await fetch("/api/configuracoes/valor-km", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Configuração salva com sucesso!")
        await carregarConfig()
      } else {
        toast.error(data.error || "Erro ao salvar configuração")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const calcularExemplo = (distancia: number, duracao: number) => {
    const valorKm = config?.valor_por_km || 1.5
    return (distancia * valorKm * 2 * duracao).toFixed(2)
  }

  const formatarValor = (valor: number) => {
    return valor?.toFixed(2) || "1.50"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">🚗 Valor por Quilômetro</h2>
        <p className="text-muted-foreground">Configure o valor cobrado por quilômetro rodado</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">💰 Valor por Quilômetro</CardTitle>
            <CardDescription>Configure o valor cobrado por quilômetro rodado nas visitas técnicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="valor-km">Valor por KM (R$)</Label>
                  <Input
                    id="valor-km"
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.valor_por_km || ""}
                    onChange={(e) => setConfig({ ...config, valor_por_km: Number(e.target.value) })}
                    className="text-lg font-semibold"
                    placeholder="1.50"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    value={config.descricao || ""}
                    onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
                    placeholder="Descrição da configuração"
                  />
                </div>
                <div>
                  <Label htmlFor="aplicacao">Aplicação (opcional)</Label>
                  <Input
                    id="aplicacao"
                    value={config.aplicacao || ""}
                    onChange={(e) => setConfig({ ...config, aplicacao: e.target.value })}
                    placeholder="Onde será aplicado"
                  />
                </div>
                <Button
                  onClick={handleSalvar}
                  className="w-full"
                  disabled={saving || !config.valor_por_km || config.valor_por_km <= 0}
                >
                  {saving ? "Salvando..." : "💾 Salvar"}
                </Button>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Valor atual: R$ {formatarValor(config.valor_por_km)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Valor cobrado por quilômetro rodado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Usado em orçamentos e contratos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Cálculo: ida + volta (× 2)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculadora de Exemplo
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Fórmula:</Label>
                    <p className="text-sm text-muted-foreground">
                      Distância × R$ {formatarValor(config.valor_por_km)} × 2 × Duração
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Distância (km)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={distanciaExemplo}
                        onChange={(e) => setDistanciaExemplo(Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Duração (dias)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={duracaoExemplo}
                        onChange={(e) => setDuracaoExemplo(Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="text-sm font-semibold">Exemplos:</p>
                    <p className="text-xs">10km × 1 dia = R$ {calcularExemplo(10, 1)}</p>
                    <p className="text-xs">15km × 3 dias = R$ {calcularExemplo(15, 3)}</p>
                    <p className="text-xs">
                      {distanciaExemplo}km × {duracaoExemplo} dia(s) = R${" "}
                      {calcularExemplo(distanciaExemplo, duracaoExemplo)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📋 Aplicado em:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Calculator className="w-3 h-3 mr-1" />
                    Cálculo de orçamentos (custo distância)
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <FileText className="w-3 h-3 mr-1" />
                    Contratos de serviços
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Propostas de conservação
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Relatórios financeiros
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>▶ Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• O valor é aplicado automaticamente nos cálculos de orçamentos</p>
              <p>• Considera ida e volta (multiplicado por 2)</p>
              <p>• Pode ser ajustado conforme necessidade do negócio</p>
              <p>• Configuração única mantida no sistema</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
