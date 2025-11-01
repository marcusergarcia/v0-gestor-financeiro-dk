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
import { useRouter, useParams } from "next/navigation"
import { useCep } from "@/hooks/use-cep"
import { useDistancia } from "@/hooks/use-distancia"

export default function EditarClientePage() {
  const [loading, setLoading] = useState(false)
  const [loadingCliente, setLoadingCliente] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [documentoUtilizado, setDocumentoUtilizado] = useState<"cnpj" | "cpf" | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string
  const { buscarCep, buscarCoordenadas, loading: loadingCep } = useCep()
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
    latitude: null as number | null,
    longitude: null as number | null,
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
    loadCliente()
  }, [clienteId])

  useEffect(() => {
    // Determinar qual documento está sendo usado com base no código existente
    if (formData.codigo && formData.cnpj) {
      const cnpjDigits = formData.cnpj.replace(/\D/g, "").substring(0, 6)
      if (cnpjDigits === formData.codigo) {
        setDocumentoUtilizado("cnpj")
      }
    }
    if (formData.codigo && formData.cpf && !documentoUtilizado) {
      const cpfDigits = formData.cpf.replace(/\D/g, "").substring(0, 6)
      if (cpfDigits === formData.codigo) {
        setDocumentoUtilizado("cpf")
      }
    }
  }, [formData.codigo, formData.cnpj, formData.cpf])

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

  const loadCliente = async () => {
    try {
      setLoadingCliente(true)
      const response = await fetch(`/api/clientes/${clienteId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const cliente = result.data
        setFormData({
          codigo: cliente.codigo || "",
          nome: cliente.nome || "",
          cnpj: cliente.cnpj || "",
          cpf: cliente.cpf || "",
          email: cliente.email || "",
          telefone: cliente.telefone || "",
          endereco: cliente.endereco || "",
          bairro: cliente.bairro || "",
          cidade: cliente.cidade || "",
          estado: cliente.estado || "",
          cep: cliente.cep || "",
          contato: cliente.contato || "",
          distancia_km: cliente.distancia_km || 0,
          latitude: cliente.latitude || null,
          longitude: cliente.longitude || null,
          sindico: cliente.sindico || "",
          rg_sindico: cliente.rg_sindico || "",
          cpf_sindico: cliente.cpf_sindico || "",
          zelador: cliente.zelador || "",
          tem_contrato: cliente.tem_contrato || false,
          dia_contrato: cliente.dia_contrato?.toString() || "",
          observacoes: cliente.observacoes || "",
          nome_adm: cliente.nome_adm || "",
          contato_adm: cliente.contato_adm || "",
          telefone_adm: cliente.telefone_adm || "",
          email_adm: cliente.email_adm || "",
        })
      } else {
        toast({
          title: "Erro",
          description: "Cliente não encontrado",
          variant: "destructive",
        })
        router.push("/clientes")
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do cliente",
        variant: "destructive",
      })
      router.push("/clientes")
    } finally {
      setLoadingCliente(false)
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

        const coordenadas = await buscarCoordenadas(data.logradouro || "", data.localidade, data.uf)

        if (coordenadas) {
          setFormData((prev) => ({
            ...prev,
            latitude: coordenadas.lat,
            longitude: coordenadas.lng,
          }))
        }

        toast({
          title: "CEP encontrado!",
          description: "Endereço e coordenadas preenchidos automaticamente",
        })
      }

      const resultadoDistancia = await calcularDistancia(cep)

      if (resultadoDistancia !== null) {
        setFormData((prev) => ({
          ...prev,
          distancia_km: resultadoDistancia,
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          dia_contrato: formData.dia_contrato ? Number.parseInt(formData.dia_contrato) : null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Cliente atualizado com sucesso!",
        })
        router.push("/clientes")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVoltar = () => {
    router.push("/clientes")
  }

  if (loadingCliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados do cliente...</p>
            </div>
          </div>
        </div>
      </div>
    )
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
                Editar Cliente
              </h1>
              <p className="text-gray-600 mt-1">Atualize as informações do cliente</p>
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
                      className="bg-gray-50 text-gray-600 h-9"
                    />
                    <Lock className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">O código não pode ser alterado</p>
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
                      readOnly={documentoUtilizado === "cnpj"}
                    />
                    {documentoUtilizado === "cnpj" && (
                      <p className="text-xs text-blue-600">ℹ️ Documento usado no cadastro</p>
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
                      readOnly={documentoUtilizado === "cpf"}
                    />
                    {documentoUtilizado === "cpf" && (
                      <p className="text-xs text-blue-600">ℹ️ Documento usado no cadastro</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="h-9"
                    />
                    {(loadingCep || loadingDistancia) && (
                      <Search className="absolute right-3 top-2 h-4 w-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Preenche endereço, coordenadas e distância</p>
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
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    placeholder="Nome da cidade"
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
                <div className="space-y-1">
                  <Label htmlFor="distancia_km">Distância (km)</Label>
                  <div className="relative">
                    <Input
                      id="distancia_km"
                      type="number"
                      value={formData.distancia_km}
                      readOnly={true}
                      placeholder="Calculado automaticamente"
                      className="bg-gray-50 text-gray-600 h-9"
                    />
                    <MapPinned className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Calculado automaticamente pelo CEP</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleVoltar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Atualizar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
