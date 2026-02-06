"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Shield,
  Upload,
  Building2,
  Hash,
  Database,
  ExternalLink,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NfseConfig {
  id?: number
  inscricao_municipal: string
  razao_social: string
  cnpj: string
  endereco: string
  numero_endereco: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  codigo_municipio: string
  codigo_servico: string
  descricao_servico: string
  aliquota_iss: number
  codigo_cnae: string
  regime_tributacao: number
  optante_simples: number
  incentivador_cultural: number
  certificado_base64: string | null
  certificado_senha: string
  certificado_validade: string
  ambiente: number
  serie_rps: string
  tipo_rps: number
  proximo_numero_rps: number
}

const defaultConfig: NfseConfig = {
  inscricao_municipal: "",
  razao_social: "",
  cnpj: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "SAO PAULO",
  uf: "SP",
  cep: "",
  codigo_municipio: "3550308",
  codigo_servico: "",
  descricao_servico: "",
  aliquota_iss: 0.05,
  codigo_cnae: "",
  regime_tributacao: 1,
  optante_simples: 0,
  incentivador_cultural: 0,
  certificado_base64: null,
  certificado_senha: "",
  certificado_validade: "",
  ambiente: 2,
  serie_rps: "NF",
  tipo_rps: 1,
  proximo_numero_rps: 1,
}

export function NfseTab() {
  const [config, setConfig] = useState<NfseConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrando, setMigrando] = useState(false)
  const [tabelasCriadas, setTabelasCriadas] = useState(false)
  const [certificadoFile, setCertificadoFile] = useState<string | null>(null)
  const [certificadoNome, setCertificadoNome] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/nfse/config")
      const result = await response.json()

      if (result.success) {
        if (result.data) {
          setConfig({ ...defaultConfig, ...result.data })
          setTabelasCriadas(true)
          if (result.data.certificado_base64 === "[CARREGADO]") {
            setCertificadoNome("Certificado carregado")
          }
        } else {
          setTabelasCriadas(true)
        }
      }
    } catch (error: any) {
      // Se der erro, pode ser que as tabelas não existam ainda
      if (error?.message?.includes("doesn't exist") || true) {
        setTabelasCriadas(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = async () => {
    setMigrando(true)
    try {
      const response = await fetch("/api/nfse/migrate", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Sucesso", description: "Tabelas NFS-e criadas com sucesso!" })
        setTabelasCriadas(true)
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao criar tabelas", variant: "destructive" })
    } finally {
      setMigrando(false)
    }
  }

  const handleSave = async () => {
    if (!config.inscricao_municipal || !config.razao_social || !config.cnpj || !config.codigo_servico) {
      toast({
        title: "Campos obrigatorios",
        description: "Preencha a inscricao municipal, razao social, CNPJ e codigo do servico",
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

      const response = await fetch("/api/nfse/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Salvo!", description: "Configuracoes NFS-e salvas com sucesso!" })
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

    // Converter para base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      setCertificadoFile(base64)
    }
    reader.readAsDataURL(file)
  }

  const updateConfig = (field: keyof NfseConfig, value: any) => {
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
        <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">NFS-e - Nota Fiscal de Servico</h2>
          <p className="text-gray-600">Configure a emissao de NFS-e para a Prefeitura de Sao Paulo</p>
        </div>
      </div>

      {/* Botão para criar tabelas se necessário */}
      {!tabelasCriadas && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Database className="h-10 w-10 text-amber-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Configuracao Inicial Necessaria</h3>
                <p className="text-sm text-amber-700 mt-1">
                  As tabelas do modulo NFS-e precisam ser criadas no banco de dados antes de utilizar este recurso.
                </p>
              </div>
              <Button onClick={handleMigrate} disabled={migrando} className="bg-amber-600 hover:bg-amber-700">
                {migrando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Criar Tabelas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <p className="text-sm text-gray-600">Notas fiscais reais serao emitidas</p>
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
                <SelectItem value="2">Homologacao</SelectItem>
                <SelectItem value="1">Producao</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.ambiente === 1 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Atencao: Em modo producao, as notas fiscais emitidas terao valor fiscal real!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados do Prestador */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Dados do Prestador
          </CardTitle>
          <CardDescription>Informacoes da sua empresa para emissao de NFS-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razao_social">Razao Social *</Label>
              <Input
                id="razao_social"
                value={config.razao_social}
                onChange={(e) => updateConfig("razao_social", e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={config.cnpj}
                onChange={(e) => updateConfig("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscricao Municipal *</Label>
              <Input
                id="inscricao_municipal"
                value={config.inscricao_municipal}
                onChange={(e) => updateConfig("inscricao_municipal", e.target.value)}
                placeholder="Numero da inscricao municipal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_municipio">Codigo do Municipio</Label>
              <Input
                id="codigo_municipio"
                value={config.codigo_municipio}
                onChange={(e) => updateConfig("codigo_municipio", e.target.value)}
                placeholder="3550308 (Sao Paulo)"
              />
            </div>
          </div>

          <Separator className="my-4" />
          <h4 className="font-medium text-gray-700">Endereco</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Logradouro</Label>
              <Input
                id="endereco"
                value={config.endereco}
                onChange={(e) => updateConfig("endereco", e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_endereco">Numero</Label>
              <Input
                id="numero_endereco"
                value={config.numero_endereco}
                onChange={(e) => updateConfig("numero_endereco", e.target.value)}
                placeholder="123"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={config.complemento}
                onChange={(e) => updateConfig("complemento", e.target.value)}
                placeholder="Sala, Andar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={config.bairro}
                onChange={(e) => updateConfig("bairro", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={config.cidade}
                onChange={(e) => updateConfig("cidade", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={config.cep}
                onChange={(e) => updateConfig("cep", e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Fiscais */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-600" />
            Dados Fiscais
          </CardTitle>
          <CardDescription>Codigos e aliquotas para emissao de NFS-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_servico">Codigo do Servico (LC 116) *</Label>
              <Input
                id="codigo_servico"
                value={config.codigo_servico}
                onChange={(e) => updateConfig("codigo_servico", e.target.value)}
                placeholder="Ex: 14.01"
              />
              <p className="text-xs text-gray-500">Consulte a lista de servicos da LC 116/2003</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_cnae">Codigo CNAE</Label>
              <Input
                id="codigo_cnae"
                value={config.codigo_cnae}
                onChange={(e) => updateConfig("codigo_cnae", e.target.value)}
                placeholder="Ex: 4322302"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aliquota_iss">Aliquota ISS (%)</Label>
              <Input
                id="aliquota_iss"
                type="number"
                step="0.01"
                value={(config.aliquota_iss * 100).toFixed(2)}
                onChange={(e) => updateConfig("aliquota_iss", Number(e.target.value) / 100)}
                placeholder="5.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao_servico">Descricao Padrao do Servico</Label>
            <Textarea
              id="descricao_servico"
              value={config.descricao_servico}
              onChange={(e) => updateConfig("descricao_servico", e.target.value)}
              placeholder="Descricao padrao que aparecera na NFS-e"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Regime de Tributacao</Label>
              <Select
                value={String(config.regime_tributacao)}
                onValueChange={(v) => updateConfig("regime_tributacao", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Microempresa Municipal</SelectItem>
                  <SelectItem value="2">Estimativa</SelectItem>
                  <SelectItem value="3">Sociedade de Profissionais</SelectItem>
                  <SelectItem value="4">Cooperativa</SelectItem>
                  <SelectItem value="5">MEI</SelectItem>
                  <SelectItem value="6">ME/EPP Simples Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Optante Simples Nacional</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={config.optante_simples === 1}
                  onCheckedChange={(checked) => updateConfig("optante_simples", checked ? 1 : 0)}
                />
                <span className="text-sm text-gray-600">
                  {config.optante_simples === 1 ? "Sim" : "Nao"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Incentivador Cultural</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={config.incentivador_cultural === 1}
                  onCheckedChange={(checked) => updateConfig("incentivador_cultural", checked ? 1 : 0)}
                />
                <span className="text-sm text-gray-600">
                  {config.incentivador_cultural === 1 ? "Sim" : "Nao"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RPS */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Configuracao do RPS
          </CardTitle>
          <CardDescription>Recibo Provisorio de Servicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serie_rps">Serie do RPS</Label>
              <Input
                id="serie_rps"
                value={config.serie_rps}
                onChange={(e) => updateConfig("serie_rps", e.target.value)}
                placeholder="NF"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo do RPS</Label>
              <Select
                value={String(config.tipo_rps)}
                onValueChange={(v) => updateConfig("tipo_rps", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">RPS</SelectItem>
                  <SelectItem value="2">RPS-Mista</SelectItem>
                  <SelectItem value="3">Cupom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proximo_rps">Proximo Numero RPS</Label>
              <Input
                id="proximo_rps"
                type="number"
                value={config.proximo_numero_rps}
                onChange={(e) => updateConfig("proximo_numero_rps", Number(e.target.value))}
                disabled
              />
              <p className="text-xs text-gray-500">Incrementado automaticamente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificado Digital */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Certificado Digital A1
          </CardTitle>
          <CardDescription>
            Upload do certificado digital para assinatura das notas fiscais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arquivo do Certificado (.pfx / .p12)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="cert-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Selecionar Arquivo</span>
                </label>
                <input
                  id="cert-upload"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificadoUpload}
                  className="hidden"
                />
                {certificadoNome && (
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {certificadoNome}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert_senha">Senha do Certificado</Label>
              <Input
                id="cert_senha"
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
              O certificado e armazenado de forma segura no banco de dados. Para emissao em producao,
              e necessario configurar um servico intermediario para assinatura com certificado TLS mutuo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Orientações SP */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Como Funciona - Prefeitura de Sao Paulo
          </CardTitle>
          <CardDescription>
            Informacoes sobre a emissao de NFS-e via Web Service em Sao Paulo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aviso importante: Não precisa de credenciamento */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Nao e necessario credenciamento separado
            </h4>
            <p className="text-sm text-gray-700">
              A Prefeitura de Sao Paulo <strong>nao exige um processo de credenciamento separado</strong> para usar o Web Service.
              A autenticacao e feita diretamente pelo seu <strong>certificado digital A1</strong> nas chamadas ao webservice.
              Como voce ja possui o certificado e a inscricao municipal ativa, voce ja pode emitir NFS-e pelo sistema.
            </p>
          </div>

          {/* Passo a Passo */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Passo a passo para comecar a emitir:</h4>

            <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-emerald-800">Preencha os dados do prestador acima</p>
                <p className="text-sm text-gray-600 mt-1">
                  Utilize as informacoes do seu perfil no portal{" "}
                  <button
                    type="button"
                    onClick={() => window.open("https://nfe.prefeitura.sp.gov.br", "_blank")}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    nfe.prefeitura.sp.gov.br
                  </button>
                  . Preencha CNPJ, Inscricao Municipal, endereco e dados fiscais conforme aparecem no portal da prefeitura.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-emerald-800">Carregue o certificado digital A1</p>
                <p className="text-sm text-gray-600 mt-1">
                  Faca o upload do seu arquivo <strong>.pfx ou .p12</strong> e informe a senha.
                  O certificado sera usado para autenticar as chamadas ao webservice e assinar digitalmente os RPS (Recibos Provisorios de Servico).
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-emerald-800">Preencha o codigo de servico</p>
                <p className="text-sm text-gray-600 mt-1">
                  No portal da prefeitura, em &quot;Configuracoes do Perfil&quot;, voce encontra o <strong>Codigo de Servico Principal</strong>.
                  No seu caso, o codigo aparece na secao &quot;Codigo de Servico Principal&quot; da pagina de configuracoes do perfil do contribuinte.
                  Informe esse codigo no campo &quot;Codigo do Servico&quot; acima.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium text-emerald-800">Teste em Homologacao primeiro</p>
                <p className="text-sm text-gray-600 mt-1">
                  Mantenha o ambiente em <strong>&quot;Homologacao&quot;</strong> (ja selecionado por padrao) e faca um teste de emissao
                  na pagina <strong>Notas Fiscais</strong>. As notas em homologacao nao tem valor fiscal.
                  Apos validar que tudo funciona, mude para &quot;Producao&quot;.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Como a emissão funciona tecnicamente */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como funciona a emissao
            </h4>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>O sistema gera um <strong>RPS</strong> (Recibo Provisorio de Servicos) com os dados da nota</li>
              <li>O RPS e enviado ao Web Service da Prefeitura de SP via SOAP com autenticacao por certificado digital</li>
              <li>A prefeitura processa o RPS e converte em <strong>NFS-e</strong> (Nota Fiscal de Servico Eletronica)</li>
              <li>O numero da NFS-e e o link de verificacao sao retornados e armazenados no sistema</li>
            </ol>
          </div>

          {/* Endpoints usados */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Endpoints do Web Service SP</h4>
            <div className="space-y-1 text-xs font-mono text-blue-700">
              <p><strong>Producao:</strong> https://nfe.prefeitura.sp.gov.br/ws/loterps.asmx</p>
              <p><strong>Homologacao:</strong> https://nfeh.prefeitura.sp.gov.br/ws/loterps.asmx</p>
            </div>
          </div>

          {/* Links Oficiais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://nfe.prefeitura.sp.gov.br", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Portal NFS-e SP
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://nfe.prefeitura.sp.gov.br/arquivos/nfews.pdf", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manual Web Service
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://www.prefeitura.sp.gov.br/cidade/secretarias/financas/servicos/?p=1883", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Secretaria da Fazenda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuracoes NFS-e
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
