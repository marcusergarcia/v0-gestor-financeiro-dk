"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, FileText, Loader2, Receipt, QrCode } from "lucide-react"
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

  const generatePix = async () => {
    if (!cliente || !formData.numeroNota || !formData.valorTotal) {
      setResult({ error: "Preencha todos os campos obrigatórios" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-pagbank-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: cliente.id,
          numeroNota: formData.numeroNota,
          valorTotal: Number.parseFloat(formData.valorTotal),
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Erro ao gerar PIX simulado" })
    } finally {
      setLoading(false)
    }
  }

  const calcularParcelas = () => {
    const numParcelas = Number.parseInt(formData.numeroParcelas) || 1
    const valorTotal = Number.parseFloat(formData.valorTotal) || 0
    const valorParcela = valorTotal / numParcelas
    const dataBase = new Date(formData.primeiroVencimento)

    const parcelas = []
    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(dataBase)
      dataVencimento.setMonth(dataVencimento.getMonth() + i)

      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        vencimento: dataVencimento.toLocaleDateString("pt-BR"),
        referencia: `${formData.numeroNota}-${String(i + 1).padStart(2, "0")}`,
      })
    }

    return parcelas
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simulador de Pagamentos PagBank</h1>
        <p className="text-muted-foreground">Gere logs de boletos e PIX usando dados reais de clientes</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pagamento</CardTitle>
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
              <div className="text-xs space-y-1">
                {Number.parseInt(formData.numeroParcelas) > 1 ? (
                  <>
                    <p className="font-semibold text-primary">
                      {formData.numeroParcelas} parcelas de R${" "}
                      {(Number.parseFloat(formData.valorTotal) / Number.parseInt(formData.numeroParcelas)).toFixed(2)}
                    </p>
                    <p className="text-muted-foreground">Intervalo de 30 dias entre parcelas</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Boleto simples (à vista)</p>
                )}
              </div>
            </div>

            {formData.numeroNota &&
              formData.valorTotal &&
              formData.primeiroVencimento &&
              Number.parseInt(formData.numeroParcelas) > 1 && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Preview das Parcelas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs space-y-1">
                      {calcularParcelas().map((parcela) => (
                        <div
                          key={parcela.numero}
                          className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                        >
                          <span className="font-mono">{parcela.referencia}</span>
                          <span className="font-semibold">R$ {parcela.valor.toFixed(2)}</span>
                          <span className="text-muted-foreground">{parcela.vencimento}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-center font-semibold text-sm">
                      <span>Total:</span>
                      <span className="text-primary">R$ {Number.parseFloat(formData.valorTotal).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

            <div className="grid grid-cols-2 gap-3">
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
                    Gerar Boleto
                  </>
                )}
              </Button>

              <Button
                onClick={generatePix}
                disabled={loading || !cliente || !formData.numeroNota || !formData.valorTotal}
                variant="secondary"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </div>
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
