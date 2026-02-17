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
  Upload,
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
  certificado_base64?: string
  certificado_senha: string
  certificado_validade?: string
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
  certificado_senha: "",
}

export function NfeTab() {
  const [config, setConfig] = useState<NfeConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [certificadoFile, setCertificadoFile] = useState<string | null>(null)
  const [certificadoNome, setCertificadoNome] = useState<string>("")
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

  const handleCertificadoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
      toast({
        title: "Arquivo invalido",
        description: "Selecione um arquivo .pfx ou .p12",
        variant: "destructive",
      })
      return
    }

    setCertificadoNome(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      setCertificadoFile(base64)
    }
    reader.readAsDataURL(file)
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
      const payload = {
        ...config,
        certificado_base64: certificadoFile || config.certificado_base64,
      }

      const response = await fetch("/api/nfe/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      {/* Certificado Digital */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Certificado Digital A1
          </CardTitle>
          <CardDescription>
            Upload do certificado digital para assinatura das NF-e
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arquivo do Certificado (.pfx / .p12)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="nfe-cert-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Selecionar Arquivo</span>
                </label>
                <input
                  id="nfe-cert-upload"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificadoUpload}
                  className="hidden"
                />
                {(certificadoNome || config.certificado_base64) && (
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {certificadoNome || "Certificado configurado"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nfe_cert_senha">Senha do Certificado</Label>
              <Input
                id="nfe_cert_senha"
                type="password"
                value={config.certificado_senha}
                onChange={(e) => updateConfig("certificado_senha", e.target.value)}
                placeholder="Senha do certificado .pfx"
              />
            </div>
          </div>
          {config.certificado_validade && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <Info className="h-4 w-4 inline mr-1" />
                Certificado valido ate: {new Date(config.certificado_validade).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              O certificado digital A1 e necessario para assinar e transmitir NF-e ao SEFAZ.
              Ele e armazenado de forma segura no banco de dados.
            </p>
          </div>

          {/* Info Simples Nacional */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <Info className="h-4 w-4 inline mr-1" />
              <span className="font-medium">Simples Nacional:</span> CFOP 5102, CSOSN 102, Origem Nacional (0) - valores fixos aplicados automaticamente.
            </p>
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
