"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, CreditCard, FileText, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function MercadoPagoTab() {
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchCliente, setSearchCliente] = useState("")

  const [boletoForm, setBoletoForm] = useState({
    clienteId: "",
    valor: 50000,
    numeroNota: "12345",
  })

  const [boletoLoading, setBoletoLoading] = useState(false)
  const [boletoResult, setBoletoResult] = useState<any>(null)

  useEffect(() => {
    fetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => setClientes(data.data || []))
      .catch((err) => console.error("Erro ao buscar clientes:", err))
  }, [])

  useEffect(() => {
    if (boletoForm.clienteId) {
      fetch(`/api/clientes/${boletoForm.clienteId}`)
        .then((res) => res.json())
        .then((data) => setClienteSelecionado(data.data))
        .catch((err) => console.error("Erro ao buscar cliente:", err))
    }
  }, [boletoForm.clienteId])

  const handleBoletoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteSelecionado) {
      setBoletoResult({ error: "Selecione um cliente" })
      return
    }

    setBoletoLoading(true)
    setBoletoResult(null)

    try {
      const response = await fetch("/api/mercadopago/boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...boletoForm,
          cliente: clienteSelecionado,
        }),
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

  const clientesFiltrados = clientes.filter((c) => c.nome?.toLowerCase().includes(searchCliente.toLowerCase()))

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
              <CardDescription>Selecione um cliente cadastrado para gerar o boleto</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBoletoSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                        {clienteSelecionado?.nome || "Selecione um cliente..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar cliente..."
                          value={searchCliente}
                          onValueChange={setSearchCliente}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {clientesFiltrados.map((cliente) => (
                              <CommandItem
                                key={cliente.id}
                                onSelect={() => {
                                  setBoletoForm({ ...boletoForm, clienteId: cliente.id })
                                  setOpenCombobox(false)
                                }}
                              >
                                {cliente.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {clienteSelecionado && (
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                      <p>
                        <strong>Email:</strong> {clienteSelecionado.email}
                      </p>
                      <p>
                        <strong>CPF/CNPJ:</strong> {clienteSelecionado.cpf_cnpj}
                      </p>
                      <p>
                        <strong>Endereço:</strong> {clienteSelecionado.endereco}, {clienteSelecionado.numero}
                      </p>
                      <p>
                        <strong>Bairro:</strong> {clienteSelecionado.bairro}
                      </p>
                      <p>
                        <strong>Cidade:</strong> {clienteSelecionado.cidade} - {clienteSelecionado.estado}
                      </p>
                      <p>
                        <strong>CEP:</strong> {clienteSelecionado.cep}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="numeroNota">Número da Nota</Label>
                    <Input
                      id="numeroNota"
                      value={boletoForm.numeroNota}
                      onChange={(e) => setBoletoForm({ ...boletoForm, numeroNota: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={boletoLoading || !clienteSelecionado}>
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
                          {boletoResult.external_resource_url && (
                            <a
                              href={boletoResult.external_resource_url}
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
