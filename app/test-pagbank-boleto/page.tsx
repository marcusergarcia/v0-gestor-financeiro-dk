"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, FileText, Loader2 } from "lucide-react"

export default function TestPagBankBoletoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    customerName: "Jose da Silva",
    customerEmail: "email@test.com",
    customerTaxId: "12345678909",
    customerPhone: "11999999999",
    addressStreet: "Avenida Brigadeiro Faria Lima",
    addressNumber: "1384",
    addressComplement: "apto 12",
    addressLocality: "Pinheiros",
    addressCity: "São Paulo",
    addressState: "SP",
    addressPostalCode: "01452002",
    itemName: "Boleto de Serviço",
    itemValue: "10000", // em centavos
    installments: "1",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const generateBoleto = async (type: "simple" | "installments") => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-pagbank-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type,
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
          Gere logs de boletos (simples e parcelados) no formato exigido pelo PagBank
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
            <CardDescription>Preencha os dados para simular a geração do boleto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome</Label>
              <Input id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerTaxId">CPF/CNPJ</Label>
                <Input id="customerTaxId" name="customerTaxId" value={formData.customerTaxId} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone</Label>
                <Input id="customerPhone" name="customerPhone" value={formData.customerPhone} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressStreet">Endereço</Label>
              <Input id="addressStreet" name="addressStreet" value={formData.addressStreet} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressNumber">Número</Label>
                <Input id="addressNumber" name="addressNumber" value={formData.addressNumber} onChange={handleChange} />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input
                  id="addressComplement"
                  name="addressComplement"
                  value={formData.addressComplement}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressCity">Cidade</Label>
                <Input id="addressCity" name="addressCity" value={formData.addressCity} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressState">Estado</Label>
                <Input
                  id="addressState"
                  name="addressState"
                  value={formData.addressState}
                  onChange={handleChange}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">CEP</Label>
              <Input
                id="addressPostalCode"
                name="addressPostalCode"
                value={formData.addressPostalCode}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Nome do Item</Label>
              <Input id="itemName" name="itemName" value={formData.itemName} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemValue">Valor (em centavos)</Label>
              <Input id="itemValue" name="itemValue" type="number" value={formData.itemValue} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Ex: 10000 = R$ 100,00</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Input
                id="installments"
                name="installments"
                type="number"
                min="1"
                max="12"
                value={formData.installments}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => generateBoleto("simple")} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Boleto Simples
              </Button>

              <Button
                onClick={() => generateBoleto("installments")}
                disabled={loading}
                variant="secondary"
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Boleto Parcelado
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
                    para baixar o arquivo.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.request, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
