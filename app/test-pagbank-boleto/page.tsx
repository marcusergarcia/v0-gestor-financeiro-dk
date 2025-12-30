"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, FileText, Loader2 } from "lucide-react"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"

export default function TestPagBankBoletoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    numeroNota: "",
    valorTotal: "100.00",
    numeroParcelas: "1",
    primeiroVencimento: "",
  })

  useEffect(() => {
    const hoje = new Date()
    hoje.setDate(hoje.getDate() + 7)
    setFormData((prev) => ({
      ...prev,
      primeiroVencimento: hoje.toISOString().split("T")[0],
    }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const generateBoleto = async () => {
    if (!cliente || !formData.numeroNota || !formData.valorTotal || !formData.primeiroVencimento) {
      setResult({ error: "Preencha todos os campos obrigatórios" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-pagbank-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: cliente.id,
          numeroNota: formData.numeroNota,
          valorTotal: Number.parseFloat(formData.valorTotal),
          numeroParcelas: Number.parseInt(formData.numeroParcelas),
          primeiroVencimento: formData.primeiroVencimento,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Erro ao gerar boleto simulado" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simulador de Boletos PagBank</h1>
        <p className="text-muted-foreground">
          Gere logs de boletos (simples e parcelados) usando dados reais de clientes
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Boleto</CardTitle>
            <CardDescription>Selecione um cliente e preencha os dados para simular</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <ClienteCombobox value={cliente} onValueChange={setCliente} placeholder="Selecione um cliente..." />
              {cliente && (
                <div className="text-sm text-muted-foreground mt-2">
                  <div>
                    <strong>Nome:</strong> {cliente.nome}
                  </div>
                  <div>
                    <strong>CPF/CNPJ:</strong> {cliente.cnpj || cliente.cpf || "Não informado"}
                  </div>
                  <div>
                    <strong>Email:</strong> {cliente.email || "Não informado"}
                  </div>
                  <div>
                    <strong>Telefone:</strong> {cliente.telefone || "Não informado"}
                  </div>
                  <div>
                    <strong>Endereço:</strong> {cliente.endereco}, {cliente.numero} - {cliente.cidade}/{cliente.estado}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroNota">Número da Nota *</Label>
              <Input
                id="numeroNota"
                name="numeroNota"
                value={formData.numeroNota}
                onChange={handleChange}
                placeholder="Ex: 689"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
              <Input
                id="valorTotal"
                name="valorTotal"
                type="number"
                step="0.01"
                value={formData.valorTotal}
                onChange={handleChange}
                placeholder="100.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primeiroVencimento">Primeiro Vencimento *</Label>
              <Input
                id="primeiroVencimento"
                name="primeiroVencimento"
                type="date"
                value={formData.primeiroVencimento}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
              <Input
                id="numeroParcelas"
                name="numeroParcelas"
                type="number"
                min="1"
                max="12"
                value={formData.numeroParcelas}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                {Number.parseInt(formData.numeroParcelas) > 1
                  ? `${formData.numeroParcelas} parcelas de R$ ${(Number.parseFloat(formData.valorTotal) / Number.parseInt(formData.numeroParcelas)).toFixed(2)}`
                  : "Boleto simples (à vista)"}
              </p>
            </div>

            <Button
              onClick={generateBoleto}
              disabled={
                loading || !cliente || !formData.numeroNota || !formData.valorTotal || !formData.primeiroVencimento
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Log de Boleto
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result && (
            <>
              {result.success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Log gerado com sucesso! Acesse{" "}
                    <a href="/configuracoes/pagbank-logs" className="font-semibold underline">
                      Logs PagBank
                    </a>{" "}
                    para baixar o arquivo TXT.
                  </AlertDescription>
                </Alert>
              )}

              {result.error && (
                <Alert variant="destructive">
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}

              {result.request && (
                <Card>
                  <CardHeader>
                    <CardTitle>Request Enviado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {result.response && (
                <Card>
                  <CardHeader>
                    <CardTitle>Response Simulado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
