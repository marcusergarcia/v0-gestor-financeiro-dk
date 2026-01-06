"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, CreditCard, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MercadoPagoTab() {
  const [boletoForm, setBoletoForm] = useState({
    nome: "Jose da Silva",
    cpf: "12345678909",
    email: "email@test.com",
    valor: 50000,
    numeroNota: "12345",
  })

  const [boletoLoading, setBoletoLoading] = useState(false)
  const [boletoResult, setBoletoResult] = useState<any>(null)

  const handleBoletoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBoletoLoading(true)
    setBoletoResult(null)

    try {
      const response = await fetch("/api/mercadopago/boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(boletoForm),
      })

      const data = await response.json()
      setBoletoResult(data)
    } catch (error: any) {
      setBoletoResult({ error: error.message })
    } finally {
      setBoletoLoading(false)
    }
  }

  const valorEmReais = (boletoForm.valor / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Integração Mercado Pago</AlertTitle>
        <AlertDescription>
          Configure seu access token nas variáveis de ambiente:{" "}
          <code className="bg-muted px-1 rounded">MERCADOPAGO_ACCESS_TOKEN</code>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="boleto" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="boleto">
            <FileText className="mr-2 h-4 w-4" />
            Boleto
          </TabsTrigger>
          <TabsTrigger value="cartao">
            <CreditCard className="mr-2 h-4 w-4" />
            Cartão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boleto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Boleto Bancário</CardTitle>
              <CardDescription>Crie um boleto para testar a integração com o Mercado Pago</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBoletoSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Cliente</Label>
                    <Input
                      id="nome"
                      value={boletoForm.nome}
                      onChange={(e) => setBoletoForm({ ...boletoForm, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={boletoForm.email}
                      onChange={(e) => setBoletoForm({ ...boletoForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF/CNPJ</Label>
                    <Input
                      id="cpf"
                      value={boletoForm.cpf}
                      onChange={(e) => setBoletoForm({ ...boletoForm, cpf: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (centavos)</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={boletoForm.valor}
                      onChange={(e) => setBoletoForm({ ...boletoForm, valor: Number.parseInt(e.target.value) })}
                      required
                    />
                    <p className="text-sm text-muted-foreground">{valorEmReais}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroNota">Número da Nota</Label>
                  <Input
                    id="numeroNota"
                    value={boletoForm.numeroNota}
                    onChange={(e) => setBoletoForm({ ...boletoForm, numeroNota: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={boletoLoading}>
                  <FileText className="mr-2 h-4 w-4" />
                  {boletoLoading ? "Gerando..." : "Gerar Boleto"}
                </Button>
              </form>

              {boletoResult && (
                <div className="mt-6">
                  {boletoResult.error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(boletoResult, null, 2)}</pre>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Boleto criado com sucesso!</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-2">
                          <p>
                            <strong>Payment ID:</strong> {boletoResult.payment_id}
                          </p>
                          <p>
                            <strong>Status:</strong> {boletoResult.status}
                          </p>
                          {boletoResult.boleto?.external_resource_url && (
                            <a
                              href={boletoResult.boleto.external_resource_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline block"
                            >
                              Ver boleto →
                            </a>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cartao">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento com Cartão</CardTitle>
              <CardDescription>Em breve...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
