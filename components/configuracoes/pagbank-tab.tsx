"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Receipt, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export function PagBankTab() {
  const [loadingBoleto, setLoadingBoleto] = useState(false)
  const [loadingCartao, setLoadingCartao] = useState(false)
  const [resultBoleto, setResultBoleto] = useState<any>(null)
  const [resultCartao, setResultCartao] = useState<any>(null)

  // Formulário Boleto
  const [formBoleto, setFormBoleto] = useState({
    nome: "Jose da Silva",
    cpf: "12345678909",
    email: "email@test.com",
    valor: "50000",
    numeroNota: "12345",
  })

  // Formulário Cartão
  const [formCartao, setFormCartao] = useState({
    nome: "Jose da Silva",
    cpf: "12345678909",
    email: "email@test.com",
    valor: "50000",
    referenceId: "ex-00001",
  })

  const handleGerarBoleto = async () => {
    setLoadingBoleto(true)
    setResultBoleto(null)

    try {
      const response = await fetch("/api/test-pagbank-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formBoleto),
      })

      const data = await response.json()
      setResultBoleto(data)
    } catch (error) {
      setResultBoleto({ error: "Erro ao simular pagamento" })
    } finally {
      setLoadingBoleto(false)
    }
  }

  const handleGerarCartao = async () => {
    setLoadingCartao(true)
    setResultCartao(null)

    try {
      const response = await fetch("/api/test-pagbank-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formCartao),
      })

      const data = await response.json()
      setResultCartao(data)
    } catch (error) {
      setResultCartao({ error: "Erro ao simular pagamento" })
    } finally {
      setLoadingCartao(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integração PagBank</h2>
          <p className="text-sm text-gray-600 mt-1">Simuladores de pagamento e logs para homologação</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/configuracoes/pagbank-logs">
            <FileText className="h-4 w-4 mr-2" />
            Ver Logs
          </Link>
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Para homologação PagBank:</strong> Execute os simuladores abaixo para gerar logs de transações. Depois
          acesse os logs, baixe o arquivo TXT e envie para o time de integração.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="boleto" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="boleto" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Simulador de Boleto
          </TabsTrigger>
          <TabsTrigger value="cartao" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Simulador de Cartão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boleto" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulador de Pagamento com Boleto</CardTitle>
              <CardDescription>
                Gera logs de pagamento via boleto no formato exigido pelo PagBank para homologação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boleto-nome">Nome do Cliente</Label>
                  <Input
                    id="boleto-nome"
                    value={formBoleto.nome}
                    onChange={(e) => setFormBoleto({ ...formBoleto, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boleto-email">Email</Label>
                  <Input
                    id="boleto-email"
                    type="email"
                    value={formBoleto.email}
                    onChange={(e) => setFormBoleto({ ...formBoleto, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boleto-cpf">CPF/CNPJ</Label>
                  <Input
                    id="boleto-cpf"
                    value={formBoleto.cpf}
                    onChange={(e) => setFormBoleto({ ...formBoleto, cpf: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boleto-valor">Valor (centavos)</Label>
                  <Input
                    id="boleto-valor"
                    type="number"
                    value={formBoleto.valor}
                    onChange={(e) => setFormBoleto({ ...formBoleto, valor: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">R$ {(Number.parseInt(formBoleto.valor) / 100).toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boleto-nota">Número da Nota</Label>
                  <Input
                    id="boleto-nota"
                    value={formBoleto.numeroNota}
                    onChange={(e) => setFormBoleto({ ...formBoleto, numeroNota: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleGerarBoleto} disabled={loadingBoleto} className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                {loadingBoleto ? "Gerando..." : "Gerar Pagamento com Boleto"}
              </Button>

              {resultBoleto && (
                <Card className={resultBoleto.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {resultBoleto.error ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Erro
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Resultado
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto max-h-60 p-2 bg-white rounded border">
                      {JSON.stringify(resultBoleto, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Próximos passos:
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
                  <li>Clique em "Gerar Pagamento com Boleto" para criar o log</li>
                  <li>Acesse a página de logs clicando no botão "Ver Logs" acima</li>
                  <li>Baixe o arquivo TXT gerado</li>
                  <li>Envie ao Maurício (Time de Integração PagBank)</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cartao" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulador de Pagamento com Cartão</CardTitle>
              <CardDescription>
                Gera logs de pagamento via cartão de crédito no formato exigido pelo PagBank
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cartao-nome">Nome do Cliente</Label>
                  <Input
                    id="cartao-nome"
                    value={formCartao.nome}
                    onChange={(e) => setFormCartao({ ...formCartao, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-email">Email</Label>
                  <Input
                    id="cartao-email"
                    type="email"
                    value={formCartao.email}
                    onChange={(e) => setFormCartao({ ...formCartao, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-cpf">CPF/CNPJ</Label>
                  <Input
                    id="cartao-cpf"
                    value={formCartao.cpf}
                    onChange={(e) => setFormCartao({ ...formCartao, cpf: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-valor">Valor (centavos)</Label>
                  <Input
                    id="cartao-valor"
                    type="number"
                    value={formCartao.valor}
                    onChange={(e) => setFormCartao({ ...formCartao, valor: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">R$ {(Number.parseInt(formCartao.valor) / 100).toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-reference">Reference ID</Label>
                  <Input
                    id="cartao-reference"
                    value={formCartao.referenceId}
                    onChange={(e) => setFormCartao({ ...formCartao, referenceId: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleGerarCartao} disabled={loadingCartao} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                {loadingCartao ? "Gerando..." : "Gerar Pagamento com Cartão"}
              </Button>

              {resultCartao && (
                <Card className={resultCartao.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {resultCartao.error ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Erro
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Resultado
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto max-h-60 p-2 bg-white rounded border">
                      {JSON.stringify(resultCartao, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Próximos passos:
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
                  <li>Clique em "Gerar Pagamento com Cartão" para criar o log</li>
                  <li>Acesse a página de logs clicando no botão "Ver Logs" acima</li>
                  <li>Baixe o arquivo TXT gerado</li>
                  <li>Envie ao time de integração do PagBank</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
