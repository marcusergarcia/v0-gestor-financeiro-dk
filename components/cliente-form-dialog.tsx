"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Save, User, Lock, Search, MapPinned } from "lucide-react"
import { useCep } from "@/hooks/use-cep"
import { useDistancia } from "@/hooks/use-distancia"

interface ClienteFormDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (cliente: any) => void
}

export function ClienteFormDialog({ children, open, onOpenChange, onSuccess }: ClienteFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { buscarCep, loading: loadingCep } = useCep()
  const { calcularDistancia, loading: loadingDistancia } = useDistancia()
  const [documentoUtilizado, setDocumentoUtilizado] = useState<"cnpj" | "cpf" | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    cnpj: "",
    cpf: "",
    email: "",
    telefone: "",
    endereco: "",
    bairro: "",
    cep: "",
    cidade: "",
    estado: "",
    distancia_km: 0,
    sindico: "",
    nome_adm: "",
    contato_adm: "",
    telefone_adm: "",
    email_adm: "",
  })

  const { toast } = useToast()

  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      cnpj: "",
      cpf: "",
      email: "",
      telefone: "",
      endereco: "",
      bairro: "",
      cep: "",
      cidade: "",
      estado: "",
      distancia_km: 0,
      sindico: "",
      nome_adm: "",
      contato_adm: "",
      telefone_adm: "",
      email_adm: "",
    })
    setDocumentoUtilizado(null)
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

    if (!formData.cnpj && !formData.cpf) {
      toast({
        title: "Erro",
        description: "CNPJ ou CPF é obrigatório para gerar o código",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const clienteData = {
        ...formData,
      }

      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Cliente cadastrado com sucesso",
        })

        resetForm()
        setIsOpen(false)

        if (onSuccess) {
          onSuccess(result.data)
        }
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao cadastrar cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const DialogComponent = (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Novo Cliente
          </DialogTitle>
          <DialogDescription>Cadastre um novo cliente no sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados Básicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <div className="relative">
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    readOnly={true}
                    placeholder="Gerado automaticamente"
                    className="bg-gray-50 text-gray-600"
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Gerado pelos primeiros 6 dígitos do documento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentoUtilizado !== "cpf" && (
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    disabled={documentoUtilizado === "cpf"}
                  />
                  {documentoUtilizado === "cnpj" && (
                    <p className="text-xs text-green-600 mt-1">✓ Usado para gerar o código</p>
                  )}
                </div>
              )}
              {documentoUtilizado !== "cnpj" && (
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    disabled={documentoUtilizado === "cnpj"}
                  />
                  {documentoUtilizado === "cpf" && (
                    <p className="text-xs text-green-600 mt-1">✓ Usado para gerar o código</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {(loadingCep || loadingDistancia) && (
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-blue-500 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Preenche endereço e distância</p>
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                placeholder="Rua, número, complemento..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
              <div>
                <Label htmlFor="distancia_km">Distância (Km)</Label>
                <div className="relative">
                  <Input
                    id="distancia_km"
                    type="number"
                    step="0.1"
                    value={formData.distancia_km}
                    readOnly={true}
                    placeholder="Calculado automaticamente"
                    className="bg-gray-50 text-gray-600"
                  />
                  <MapPinned className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Calculado pelo CEP</p>
              </div>
            </div>
          </div>

          {/* Informações do Síndico */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Síndico (Opcional)</h3>
            <div>
              <Label htmlFor="sindico">Nome do Síndico</Label>
              <Input
                id="sindico"
                value={formData.sindico}
                onChange={(e) => handleInputChange("sindico", e.target.value)}
                placeholder="Nome completo do síndico"
              />
            </div>
          </div>

          {/* Administradora */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Administradora (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_adm">Nome da Administradora</Label>
                <Input
                  id="nome_adm"
                  value={formData.nome_adm}
                  onChange={(e) => handleInputChange("nome_adm", e.target.value)}
                  placeholder="Nome da administradora"
                />
              </div>
              <div>
                <Label htmlFor="contato_adm">Contato</Label>
                <Input
                  id="contato_adm"
                  value={formData.contato_adm}
                  onChange={(e) => handleInputChange("contato_adm", e.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone_adm">Telefone</Label>
                <Input
                  id="telefone_adm"
                  value={formData.telefone_adm}
                  onChange={(e) => handleInputChange("telefone_adm", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email_adm">Email</Label>
                <Input
                  id="email_adm"
                  type="email"
                  value={formData.email_adm}
                  onChange={(e) => handleInputChange("email_adm", e.target.value)}
                  placeholder="email@administradora.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nome.trim() || (!formData.cnpj && !formData.cpf)}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return DialogComponent
}
