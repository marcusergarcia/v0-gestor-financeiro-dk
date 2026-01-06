"use client"

import { useState, useEffect } from "react"
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
    numeroCartao: "4111111111111111",
    mesValidade: "12",
    anoValidade: "2030",
    cvv: "123",
    nomeCartao: "Jose da Silva",
  })

  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js"
    script.async = true
    script.onload = () => {
      console.log("[v0] PagBank SDK carregado")
      setSdkLoaded(true)
    }
    script.onerror = () => {
      console.error("[v0] Erro ao carregar SDK do PagBank")
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

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
      if (!sdkLoaded || !(window as any).PagSeguro) {
        throw new Error("SDK do PagBank não carregado")
      }

      // Obter chave pública do PagBank
      const publicKeyResponse = await fetch("/api/pagseguro/public-key")
      const { publicKey } = await publicKeyResponse.json()

      // Criptografar cartão usando SDK do PagBank
      const card = (window as any).PagSeguro.encryptCard({
        publicKey,
        holder: formCartao.nomeCartao,
        number: formCartao.numeroCartao.replace(/\s/g, ""),
        expMonth: formCartao.mesValidade,
        expYear: formCartao.anoValidade,
        securityCode: formCartao.cvv,
      })

      const encryptedCard = card.encryptedCard

      console.log("[v0] Cartão criptografado:", encryptedCard)

      const response = await fetch("/api/test-pagbank-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formCartao,
          encryptedCard,
        }),
      })

      const data = await response.json()
      setResultCartao(data)
    } catch (error: any) {
      console.error("[v0] Erro ao gerar pagamento:", error)
      setResultCartao({ error: error.message || "Erro ao simular pagamento" })
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
              {!sdkLoaded && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Carregando SDK do PagBank...</AlertDescription>
                </Alert>
              )}

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

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="cartao-numero">Número do Cartão</Label>
                  <Input
                    id="cartao-numero"
                    value={formCartao.numeroCartao}
                    onChange={(e) => setFormCartao({ ...formCartao, numeroCartao: e.target.value })}
                    placeholder="4111 1111 1111 1111"
                  />
                  <p className="text-xs text-gray-500">Use 4111111111111111 para testes</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-nome-titular">Nome no Cartão</Label>
                  <Input
                    id="cartao-nome-titular"
                    value={formCartao.nomeCartao}
                    onChange={(e) => setFormCartao({ ...formCartao, nomeCartao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-cvv">CVV</Label>
                  <Input
                    id="cartao-cvv"
                    value={formCartao.cvv}
                    onChange={(e) => setFormCartao({ ...formCartao, cvv: e.target.value })}
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-mes">Mês Validade</Label>
                  <Input
                    id="cartao-mes"
                    value={formCartao.mesValidade}
                    onChange={(e) => setFormCartao({ ...formCartao, mesValidade: e.target.value })}
                    placeholder="12"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cartao-ano">Ano Validade</Label>
                  <Input
                    id="cartao-ano"
                    value={formCartao.anoValidade}
                    onChange={(e) => setFormCartao({ ...formCartao, anoValidade: e.target.value })}
                    placeholder="2030"
                    maxLength={4}
                  />
                </div>
              </div>

              <Button onClick={handleGerarCartao} disabled={loadingCartao || !sdkLoaded} className="w-full">
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
