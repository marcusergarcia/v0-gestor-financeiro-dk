"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, User, Phone, MapPin, Lock, Building2, Search, MapPinned } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useCep } from "@/hooks/use-cep"
import { useDistancia } from "@/hooks/use-distancia"

export default function NovoClientePage() {
  const [loading, setLoading] = useState(false)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [documentoUtilizado, setDocumentoUtilizado] = useState<"cnpj" | "cpf" | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { buscarCep, loading: loadingCep } = useCep()
  const { calcularDistancia, loading: loadingDistancia } = useDistancia()

  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    cnpj: "",
    cpf: "",
    email: "",
    telefone: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    contato: "",
    distancia_km: 0,
    sindico: "",
    rg_sindico: "",
    cpf_sindico: "",
    zelador: "",
    tem_contrato: false,
    dia_contrato: "",
    observacoes: "",
    nome_adm: "",
    contato_adm: "",
    telefone_adm: "",
    email_adm: "",
  })

  useEffect(() => {
    loadLogoMenu()
  }, [])

  useEffect(() => {
    const generateCodigoFromDocument = () => {
      let documento = ""
      let tipoDoc: "cnpj" | "cpf" | null = null

      if (formData.cnpj) {
        documento = formData.cnpj.replace(/\D/g, "")
        tipoDoc = "cnpj"
      } else if (formData.cpf) {
        documento = formData.cpf.replace(/\D/g, "")
        tipoDoc = "cpf"
      }

      if (documento.length >= 6) {
        const codigo = documento.substring(0, 6)
        setFormData((prev) => ({ ...prev, codigo }))
        setDocumentoUtilizado(tipoDoc)
      } else {
        setDocumentoUtilizado(null)
      }
    }

    generateCodigoFromDocument()
  }, [formData.cnpj, formData.cpf])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCepChange = async (cep: string) => {
    handleInputChange("cep", cep)

    const cepLimpo = cep.replace(/\D/g, "")

    if (cepLimpo.length === 8) {
      const data = await buscarCep(cep)

      if (data) {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))

        toast({
          title: "CEP encontrado!",
          description: "Endereço preenchido automaticamente",
        })
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Preencha o endereço manualmente",
          variant: "destructive",
        })
      }

      const distancia = await calcularDistancia(cep)
      if (distancia !== null) {
        setFormData((prev) => ({
          ...prev,
          distancia_km: distancia,
        }))
      }
    }
  }

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!formData.nome.trim()) {
      const msg = "Nome e obrigatorio"
      setSubmitError(msg)
      toast({
        title: "Erro de validacao",
        description: msg,
        variant: "destructive",
      })
      return
    }

    if (!formData.cnpj && !formData.cpf) {
      const msg = "CNPJ ou CPF e obrigatorio para gerar o codigo"
      setSubmitError(msg)
      toast({
        title: "Erro de validacao",
        description: msg,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        dia_contrato: formData.dia_contrato ? Number.parseInt(formData.dia_contrato) : null,
      }

      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Cliente criado com sucesso!",
        })
        router.push("/clientes")
      } else {
        // Montar titulo adequado baseado no campo duplicado
        let titulo = "Erro ao salvar"
        if (result.field === "cnpj") titulo = "CNPJ ja cadastrado"
        else if (result.field === "cpf") titulo = "CPF ja cadastrado"
        else if (result.field === "codigo") titulo = "Codigo ja cadastrado"

        const msg = result.message || "Erro ao criar cliente"
        setSubmitError(msg)
        toast({
          title: titulo,
          description: msg,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const msg = "Erro de conexao. Tente novamente."
      setSubmitError(msg)
      toast({
        title: "Erro de conexao",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVoltar = () => {
    router.push("/clientes")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={handleVoltar} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Novo Cliente
              </h1>
              <p className="text-gray-600 mt-1">Cadastre um novo cliente no sistema</p>
            </div>
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1 border"
              />
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas + Documentos */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription className="text-blue-100">Dados principais e documentos do cliente</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="codigo">Código *</Label>
                  <div className="relative">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      readOnly={true}
                      placeholder="Gerado automaticamente"
                      className="bg-gray-50 text-gray-600 h-9"
                    />
                    <Lock className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Gerado pelos primeiros 6 dígitos do documento</p>
                </div>
                {documentoUtilizado !== "cpf" && (
                  <div className="space-y-1">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="h-9"
                      disabled={documentoUtilizado === "cpf"}
                    />
                    {documentoUtilizado === "cnpj" && (
                      <p className="text-xs text-green-600">✓ Usado para gerar o código</p>
                    )}
                  </div>
                )}
                {documentoUtilizado !== "cnpj" && (
                  <div className="space-y-1">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      className="h-9"
                      disabled={documentoUtilizado === "cnpj"}
                    />
                    {documentoUtilizado === "cpf" && (
                      <p className="text-xs text-green-600">✓ Usado para gerar o código</p>
                    )}
                  </div>
                )}
                <div className={`space-y-1 ${documentoUtilizado ? "md:col-span-2" : ""}`}>
                  <Label htmlFor="nome">Nome/Razão Social *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Nome completo ou razão social"
                    required
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
              <CardDescription className="text-purple-100">Email, telefone e pessoas de contato</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contato">Pessoa de Contato</Label>
                  <Input
                    id="contato"
                    value={formData.contato}
                    onChange={(e) => handleInputChange("contato", e.target.value)}
                    placeholder="Nome do contato principal"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sindico">Síndico</Label>
                  <Input
                    id="sindico"
                    value={formData.sindico}
                    onChange={(e) => handleInputChange("sindico", e.target.value)}
                    placeholder="Nome do síndico"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rg_sindico">RG do Síndico</Label>
                  <Input
                    id="rg_sindico"
                    value={formData.rg_sindico}
                    onChange={(e) => handleInputChange("rg_sindico", e.target.value)}
                    placeholder="00.000.000-0"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpf_sindico">CPF do Síndico</Label>
                  <Input
                    id="cpf_sindico"
                    value={formData.cpf_sindico}
                    onChange={(e) => handleInputChange("cpf_sindico", e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="zelador">Zelador</Label>
                <Input
                  id="zelador"
                  value={formData.zelador}
                  onChange={(e) => handleInputChange("zelador", e.target.value)}
                  placeholder="Nome do zelador"
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço + Contrato */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5" />
                Localização e Contrato
              </CardTitle>
              <CardDescription className="text-orange-100">Endereço completo e informações contratuais</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="h-9 pr-10"
                      maxLength={9}
                    />
                    {(loadingCep || loadingDistancia) && (
                      <Search className="absolute right-3 top-2 h-4 w-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Preenche endereço e distância</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                    placeholder="Bairro"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    placeholder="Cidade"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange("estado", e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    className="h-9 uppercase"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange("endereco", e.target.value)}
                  placeholder="Rua, número, complemento"
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="distancia_km">Distância (km)</Label>
                  <div className="relative">
                    <Input
                      id="distancia_km"
                      type="number"
                      value={formData.distancia_km}
                      readOnly={true}
                      placeholder="Calculado automaticamente"
                      className="h-9 bg-gray-50 text-gray-600 pr-10"
                    />
                    <MapPinned className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Calculado automaticamente pelo CEP</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tem_contrato" className="flex items-center space-x-2">
                    <Switch
                      id="tem_contrato"
                      checked={formData.tem_contrato}
                      onCheckedChange={(checked) => handleInputChange("tem_contrato", checked)}
                    />
                    <span>Possui Contrato</span>
                  </Label>
                </div>
                {formData.tem_contrato && (
                  <div className="space-y-1">
                    <Label htmlFor="dia_contrato">Dia do Vencimento</Label>
                    <Input
                      id="dia_contrato"
                      type="number"
                      value={formData.dia_contrato}
                      onChange={(e) => handleInputChange("dia_contrato", e.target.value)}
                      placeholder="Ex: 15"
                      min="1"
                      max="31"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  placeholder="Observações adicionais sobre o cliente"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações da Administradora */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5" />
                Informações da Administradora
              </CardTitle>
              <CardDescription className="text-teal-100">Dados da empresa administradora do condomínio</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nome_adm">Nome</Label>
                  <Input
                    id="nome_adm"
                    value={formData.nome_adm}
                    onChange={(e) => handleInputChange("nome_adm", e.target.value)}
                    placeholder="Nome da empresa administradora"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contato_adm">Contato</Label>
                  <Input
                    id="contato_adm"
                    value={formData.contato_adm}
                    onChange={(e) => handleInputChange("contato_adm", e.target.value)}
                    placeholder="Nome do contato na administradora"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="telefone_adm">Telefone</Label>
                  <Input
                    id="telefone_adm"
                    value={formData.telefone_adm}
                    onChange={(e) => handleInputChange("telefone_adm", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email_adm">Email</Label>
                  <Input
                    id="email_adm"
                    type="email"
                    value={formData.email_adm}
                    onChange={(e) => handleInputChange("email_adm", e.target.value)}
                    placeholder="contato@administradora.com"
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Erro visível */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">!</div>
              <div>
                <p className="font-medium text-red-800">Erro ao salvar cliente</p>
                <p className="text-sm text-red-600 mt-1">{submitError}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto text-red-500 hover:text-red-700"
                onClick={() => setSubmitError(null)}
              >
                Fechar
              </Button>
            </div>
          )}

          {/* Botoes de Acao */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleVoltar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
