"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Shield,
  Building2,
  Hash,
  Info,
  Package,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NfeConfig {
  id?: number
  razao_social: string
  nome_fantasia: string
  cnpj: string
  inscricao_estadual: string
  endereco: string
  numero_endereco: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  codigo_municipio: string
  telefone: string
  crt: number
  serie_nfe: number
  proximo_numero_nfe: number
  ambiente: number
  info_complementar: string
  natureza_operacao: string
}

const defaultConfig: NfeConfig = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_estadual: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "SAO PAULO",
  uf: "SP",
  cep: "",
  codigo_municipio: "3550308",
  telefone: "",
  crt: 1,
  serie_nfe: 1,
  proximo_numero_nfe: 1,
  ambiente: 2,
  info_complementar: "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.",
  natureza_operacao: "Venda",
}

export function NfeTab() {
  const [config, setConfig] = useState<NfeConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/nfe/config")
      const result = await response.json()

      if (result.success && result.data) {
        setConfig({ ...defaultConfig, ...result.data })
      }
    } catch (error: any) {
      console.error("Erro ao carregar config NF-e:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.razao_social || !config.cnpj || !config.inscricao_estadual) {
      toast({
        title: "Campos obrigatorios",
        description: "Preencha a razao social, CNPJ e inscricao estadual",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/nfe/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Salvo!", description: "Configuracoes NF-e salvas com sucesso!" })
        loadConfig()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao salvar configuracoes", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (field: keyof NfeConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Package className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">NF-e - Nota Fiscal de Material</h2>
          <p className="text-gray-600">Configure a emissao de NF-e (material/produto) via SEFAZ-SP</p>
        </div>
      </div>

      {/* Info box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Certificado Digital</p>
              <p className="mt-1">
                O certificado digital A1 (.pfx) configurado na aba NFS-e sera reutilizado para a NF-e.
                Nao e necessario fazer upload novamente.
              </p>
              <p className="mt-1">
                <span className="font-medium">Simples Nacional:</span> CFOP 5102, CSOSN 102, Origem Nacional (0) - valores fixos aplicados automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ambiente */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Ambiente
          </CardTitle>
          <CardDescription>Selecione entre homologacao (teste) e producao</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              {config.ambiente === 1 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Producao</p>
                    <p className="text-sm text-gray-600">Notas fiscais reais serao emitidas na SEFAZ</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-700">Homologacao (Testes)</p>
                    <p className="text-sm text-gray-600">Notas fiscais de teste - sem valor fiscal</p>
                  </div>
                </>
              )}
            </div>
            <Select
              value={String(config.ambiente)}
              onValueChange={(v) => updateConfig("ambiente", Number(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Homologacao
                  </div>
                </SelectItem>
                <SelectItem value="1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Producao
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Emitente */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Dados do Emitente
          </CardTitle>
          <CardDescription>Informacoes da empresa para a NF-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Razao Social *</Label>
              <Input
                value={config.razao_social}
                onChange={(e) => updateConfig("razao_social", e.target.value)}
                placeholder="Razao social da empresa"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Nome Fantasia</Label>
              <Input
                value={config.nome_fantasia}
                onChange={(e) => updateConfig("nome_fantasia", e.target.value)}
                placeholder="Nome fantasia"
              />
            </div>
            <div>
              <Label>CNPJ *</Label>
              <Input
                value={config.cnpj}
                onChange={(e) => updateConfig("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <Label>Inscricao Estadual *</Label>
              <Input
                value={config.inscricao_estadual}
                onChange={(e) => updateConfig("inscricao_estadual", e.target.value)}
                placeholder="Inscricao Estadual (sem pontos)"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={config.telefone}
                onChange={(e) => updateConfig("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label>CRT (Codigo de Regime Tributario)</Label>
              <Select
                value={String(config.crt)}
                onValueChange={(v) => updateConfig("crt", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Simples Nacional</SelectItem>
                  <SelectItem value="2">2 - Simples Nacional (excesso sublimite)</SelectItem>
                  <SelectItem value="3">3 - Regime Normal</SelectItem>
                  <SelectItem value="4">4 - MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Endereco */}
          <h3 className="text-lg font-semibold text-gray-700">Endereco do Emitente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Logradouro</Label>
              <Input
                value={config.endereco}
                onChange={(e) => updateConfig("endereco", e.target.value)}
                placeholder="Rua, Avenida..."
              />
            </div>
            <div>
              <Label>Numero</Label>
              <Input
                value={config.numero_endereco}
                onChange={(e) => updateConfig("numero_endereco", e.target.value)}
                placeholder="Numero"
              />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input
                value={config.complemento}
                onChange={(e) => updateConfig("complemento", e.target.value)}
                placeholder="Sala, Andar..."
              />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={config.bairro}
                onChange={(e) => updateConfig("bairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={config.cep}
                onChange={(e) => updateConfig("cep", e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={config.cidade}
                onChange={(e) => updateConfig("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label>UF</Label>
              <Select
                value={config.uf}
                onValueChange={(v) => updateConfig("uf", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Codigo Municipio IBGE</Label>
              <Input
                value={config.codigo_municipio}
                onChange={(e) => updateConfig("codigo_municipio", e.target.value)}
                placeholder="3550308"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuracoes Fiscais */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-blue-600" />
            Configuracoes Fiscais
          </CardTitle>
          <CardDescription>Parametros para emissao da NF-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Serie NF-e</Label>
              <Input
                type="number"
                value={config.serie_nfe}
                onChange={(e) => updateConfig("serie_nfe", Number(e.target.value))}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Proximo Numero NF-e</Label>
              <Input
                type="number"
                value={config.proximo_numero_nfe}
                onChange={(e) => updateConfig("proximo_numero_nfe", Number(e.target.value))}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Natureza da Operacao</Label>
              <Input
                value={config.natureza_operacao}
                onChange={(e) => updateConfig("natureza_operacao", e.target.value)}
                placeholder="Venda"
              />
            </div>
          </div>

          <div>
            <Label>Informacoes Complementares</Label>
            <Textarea
              value={config.info_complementar}
              onChange={(e) => updateConfig("info_complementar", e.target.value)}
              placeholder="Informacoes adicionais que aparecerão na NF-e"
              rows={3}
            />
          </div>

          {/* Valores Fixos - Simples Nacional */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Valores Fixos - Simples Nacional</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white border">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">CFOP</p>
                  <p className="text-lg font-bold text-gray-800">5102</p>
                  <p className="text-xs text-gray-500">Venda de mercadoria adquirida</p>
                </div>
                <div className="p-3 rounded-lg bg-white border">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">CSOSN</p>
                  <p className="text-lg font-bold text-gray-800">102</p>
                  <p className="text-xs text-gray-500">Tributada sem permissao de credito</p>
                </div>
                <div className="p-3 rounded-lg bg-white border">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Origem</p>
                  <p className="text-lg font-bold text-gray-800">0 - Nacional</p>
                  <p className="text-xs text-gray-500">Mercadoria nacional</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Botao Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 shadow-lg"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Configuracoes NF-e
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
