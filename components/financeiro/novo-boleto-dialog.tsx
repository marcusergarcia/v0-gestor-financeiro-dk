"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { PreviewParcelasDialog } from "./preview-parcelas-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Calculator, Calendar } from "lucide-react"

interface ParcelaPreview {
  parcela: number
  numero_boleto: string
  valor: number
  vencimento: string
  status: string
  descricao?: string
  multa_percentual?: number
  juros_mes_percentual?: number
}

interface NovoBoletoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notaFiscal?: any
  onSuccess: () => void
}

export function NovoBoletoDialog({ open, onOpenChange, notaFiscal, onSuccess }: NovoBoletoDialogProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contratoInfo, setContratoInfo] = useState<{ dia_contrato?: number; tem_contrato?: boolean } | null>(null)
  const [numeroNota, setNumeroNota] = useState("")
  const [dataNota, setDataNota] = useState("")
  const [numeroNotaError, setNumeroNotaError] = useState("")
  const [valorTotal, setValorTotal] = useState("")
  const [primeiroVencimento, setPrimeiroVencimento] = useState("")
  const [numeroParcelas, setNumeroParcelas] = useState("1")
  const [intervalo, setIntervalo] = useState("30")
  const [formaPagamento, setFormaPagamento] = useState("boleto")
  const [observacoes, setObservacoes] = useState("")
  const [multaPercentual, setMultaPercentual] = useState("2.00")
  const [jurosMesPercentual, setJurosMesPercentual] = useState("1.00")
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [parcelas, setParcelas] = useState<ParcelaPreview[]>([])

  const gerarDescricao = (): string => {
    if (!numeroNota.trim()) return ""

    const partes: string[] = ["NOTA FISCAL", numeroNota.trim()]

    if (dataNota) {
      const dataFormatada = new Date(dataNota + "T00:00:00").toLocaleDateString("pt-BR")
      partes.push(dataFormatada)
    }

    partes.push(`Parcelas 1/${numeroParcelas}`)

    return partes.join(" - ")
  }

  useEffect(() => {
    if (open) {
      const hoje = new Date()
      hoje.setDate(hoje.getDate() + 7)
      setPrimeiroVencimento(hoje.toISOString().split("T")[0])
      setDataNota(new Date().toISOString().split("T")[0])
    }
  }, [open])

  const buscarInfoCliente = async (clienteId: string) => {
    try {
      console.log("Buscando informações do cliente:", clienteId)

      const clienteResponse = await fetch(`/api/clientes/${clienteId}`)
      if (clienteResponse.ok) {
        const clienteData = await clienteResponse.json()
        console.log("Dados do cliente:", clienteData)

        if (clienteData.tem_contrato && clienteData.dia_contrato) {
          console.log("Cliente tem contrato com dia:", clienteData.dia_contrato)
          setContratoInfo({
            tem_contrato: true,
            dia_contrato: clienteData.dia_contrato,
          })
        } else {
          console.log("Cliente não tem contrato definido, buscando contrato de conservação...")

          const conservacaoResponse = await fetch(`/api/contratos-conservacao/cliente/${clienteId}`)

          if (conservacaoResponse.ok) {
            const conservacaoResult = await conservacaoResponse.json()
            console.log("Resultado contrato conservação:", conservacaoResult)

            if (conservacaoResult.success && conservacaoResult.data && conservacaoResult.data.dia_vencimento) {
              console.log(
                "Contrato de conservação encontrado com dia_vencimento:",
                conservacaoResult.data.dia_vencimento,
              )
              setContratoInfo({
                tem_contrato: true,
                dia_contrato: conservacaoResult.data.dia_vencimento,
              })
            } else {
              console.log("Nenhum contrato de conservação encontrado")
              setContratoInfo({ tem_contrato: false })
            }
          } else {
            console.log("Erro ao buscar contrato de conservação")
            setContratoInfo({ tem_contrato: false })
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar informações do cliente:", error)
      setContratoInfo(null)
    }
  }

  const verificarNumeroExistente = async (numero: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/boletos/verificar-numero?numero=${encodeURIComponent(numero)}`)
      const result = await response.json()
      return result.existe
    } catch (error) {
      console.error("Erro ao verificar número:", error)
      return false
    }
  }

  const handleNumeroNotaChange = async (value: string) => {
    setNumeroNota(value)
    setNumeroNotaError("")

    if (value.trim()) {
      const existe = await verificarNumeroExistente(value.trim())
      if (existe) {
        setNumeroNotaError("Este número já existe. Escolha outro número.")
      }
    }
  }

  const handleClienteChange = (clienteSelecionado: Cliente | null) => {
    console.log("Cliente selecionado no dialog:", clienteSelecionado)
    setCliente(clienteSelecionado)
  }

  const calcularStatus = (dataVencimento: string): string => {
    const hoje = new Date()
    const vencimento = new Date(dataVencimento + "T00:00:00")

    hoje.setHours(0, 0, 0, 0)
    vencimento.setHours(0, 0, 0, 0)

    if (vencimento < hoje) {
      return "Vencido"
    }
    return "Pendente"
  }

  const calcularDatasVencimento = (dataInicial: string, intervaloDias: number, numeroParcelas: number): string[] => {
    const datas: string[] = []
    const dataBase = new Date(dataInicial + "T00:00:00")

    for (let i = 0; i < numeroParcelas; i++) {
      const novaData = new Date(dataBase)
      novaData.setDate(dataBase.getDate() + i * intervaloDias)
      datas.push(novaData.toISOString().split("T")[0])
    }

    return datas
  }

  const gerarPreview = () => {
    if (!cliente || !valorTotal || !primeiroVencimento || !numeroNota.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (numeroNotaError) {
      toast({
        title: "Erro",
        description: "Corrija o número da nota antes de continuar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const valor = Number.parseFloat(valorTotal.replace(",", "."))
    const numParcelas = Number.parseInt(numeroParcelas)
    const intervaloDias = Number.parseInt(intervalo)

    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser um número positivo",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    verificarNumeroExistente(numeroNota.trim())
      .then((existe) => {
        if (existe) {
          setNumeroNotaError("Este número já existe. Escolha outro número.")
          toast({
            title: "Erro",
            description: "Este número já existe. Escolha outro número.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const datasVencimento = calcularDatasVencimento(primeiroVencimento, intervaloDias, numParcelas)

        const valorParcela = valor / numParcelas
        const valorUltimaParcela = valor - valorParcela * (numParcelas - 1)

        const parcelasPreview: ParcelaPreview[] = datasVencimento.map((data: string, index: number) => ({
          parcela: index + 1,
          numero_boleto: numParcelas > 1 ? `${numeroNota}-${String(index + 1).padStart(2, "0")}` : numeroNota,
          valor: index === numParcelas - 1 ? valorUltimaParcela : valorParcela,
          vencimento: data,
          status: calcularStatus(data),
          descricao: gerarDescricao(),
          multa_percentual: Number.parseFloat(multaPercentual),
          juros_mes_percentual: Number.parseFloat(jurosMesPercentual),
        }))

        console.log("Parcelas geradas:", parcelasPreview)
        setParcelas(parcelasPreview)
        setPreviewOpen(true)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Erro ao gerar preview:", error)
        toast({
          title: "Erro",
          description: "Erro ao gerar preview das parcelas",
          variant: "destructive",
        })
        setLoading(false)
      })
  }

  const handleEmitirBoletos = async () => {
    if (!cliente) {
      toast({
        title: "Erro",
        description: "Cliente não selecionado",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/boletos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota_fiscal_id: notaFiscal?.id,
          cliente_id: cliente?.id,
          numero_nota: numeroNota,
          data_nota: dataNota,
          valor_total: Number.parseFloat(valorTotal.replace(",", ".")) || 0,
          primeiro_vencimento: primeiroVencimento,
          numero_parcelas: Number.parseInt(numeroParcelas),
          intervalo: Number.parseInt(intervalo),
          forma_pagamento: formaPagamento,
          observacoes,
          multa_percentual: Number.parseFloat(multaPercentual),
          juros_mes_percentual: Number.parseFloat(jurosMesPercentual),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Boletos emitidos com sucesso!",
        })
        onSuccess()
        resetForm()
        setPreviewOpen(false)
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao emitir boletos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao emitir boletos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCliente(null)
    setContratoInfo(null)
    setNumeroNota("")
    setDataNota("")
    setNumeroNotaError("")
    setValorTotal("")
    setPrimeiroVencimento("")
    setNumeroParcelas("1")
    setIntervalo("30")
    setFormaPagamento("boleto")
    setObservacoes("")
    setParcelas([])
    setMultaPercentual("2.00")
    setJurosMesPercentual("1.00")
  }

  const handleClose = () => {
    resetForm()
    setPreviewOpen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            Novo Boleto
          </DialogTitle>
          <DialogDescription className="text-green-100">
            Preencha as informações para gerar o(s) boleto(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente" className="text-sm font-semibold text-gray-700">
                Cliente *
              </Label>
              <ClienteCombobox
                value={cliente}
                onValueChange={handleClienteChange}
                placeholder="Selecione um cliente..."
              />
              <div className="flex items-center gap-4 flex-wrap">
                {cliente && (
                  <div className="text-sm text-gray-600">
                    Selecionado: <span className="font-medium">{cliente.nome}</span>
                  </div>
                )}
                {contratoInfo?.tem_contrato && contratoInfo?.dia_contrato && (
                  <div className="flex items-center gap-1 text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
                    <Calendar className="h-4 w-4" />
                    Dia do Contrato: {contratoInfo.dia_contrato}
                  </div>
                )}
                {contratoInfo?.tem_contrato === false && (
                  <div className="text-sm text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md">
                    Cliente sem contrato ativo
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero-nota" className="text-sm font-semibold text-gray-700">
                  Número da Nota *
                </Label>
                <Input
                  id="numero-nota"
                  value={numeroNota}
                  onChange={(e) => handleNumeroNotaChange(e.target.value)}
                  placeholder="Digite o número da nota"
                  className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                    numeroNotaError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {numeroNotaError && <p className="text-sm text-red-500 mt-1">{numeroNotaError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-nota" className="text-sm font-semibold text-gray-700">
                  Data da Nota *
                </Label>
                <Input
                  id="data-nota"
                  type="date"
                  value={dataNota}
                  onChange={(e) => setDataNota(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor-total" className="text-sm font-semibold text-gray-700">
                  Valor Total *
                </Label>
                <Input
                  id="valor-total"
                  type="number"
                  step="0.01"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  placeholder="0,00"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primeiro-vencimento" className="text-sm font-semibold text-gray-700">
                  Primeiro Vencimento *
                </Label>
                <Input
                  id="primeiro-vencimento"
                  type="date"
                  value={primeiroVencimento}
                  onChange={(e) => setPrimeiroVencimento(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero-parcelas" className="text-sm font-semibold text-gray-700">
                  Número de Parcelas
                </Label>
                <Input
                  id="numero-parcelas"
                  type="number"
                  min="1"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalo" className="text-sm font-semibold text-gray-700">
                  Intervalo (dias)
                </Label>
                <Input
                  id="intervalo"
                  type="number"
                  min="1"
                  value={intervalo}
                  onChange={(e) => setIntervalo(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="multa-percentual" className="text-sm font-semibold text-gray-700">
                  Multa por Atraso (%)
                </Label>
                <Input
                  id="multa-percentual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={multaPercentual}
                  onChange={(e) => setMultaPercentual(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="2.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="juros-mes" className="text-sm font-semibold text-gray-700">
                  Juros ao Mês (%)
                </Label>
                <Input
                  id="juros-mes"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={jurosMesPercentual}
                  onChange={(e) => setJurosMesPercentual(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="1.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma-pagamento" className="text-sm font-semibold text-gray-700">
                Forma de Pagamento
              </Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {numeroNota.trim() && (
              <div className="space-y-2">
                <Label htmlFor="descricao-produto" className="text-sm font-semibold text-gray-700">
                  Descrição do Produto/Serviço (PagBank)
                </Label>
                <Input
                  id="descricao-produto"
                  value={gerarDescricao()}
                  readOnly
                  disabled
                  className="border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Esta descrição será enviada automaticamente ao PagBank</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-semibold text-gray-700">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-0 border-t border-gray-100 bg-white">
          <Button variant="outline" onClick={handleClose} className="border-gray-200 hover:bg-gray-50 bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={gerarPreview}
            disabled={
              loading || !cliente || !valorTotal || !primeiroVencimento || !numeroNota.trim() || !!numeroNotaError
            }
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Carregando...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Visualizar Parcelas
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      <PreviewParcelasDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        parcelas={parcelas}
        cliente={cliente}
        numeroNota={numeroNota}
        valorTotal={Number.parseFloat(valorTotal.replace(",", ".")) || 0}
        formaPagamento={formaPagamento}
        multaPercentual={Number.parseFloat(multaPercentual)}
        jurosMesPercentual={Number.parseFloat(jurosMesPercentual)}
        onEmitir={handleEmitirBoletos}
        onVoltar={() => setPreviewOpen(false)}
        loading={loading}
      />
    </Dialog>
  )
}

export { NovoBoletoDialog as NovoBoletoDiaolog }
