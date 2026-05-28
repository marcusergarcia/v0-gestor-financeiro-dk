"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Printer,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  AlertTriangle,
  Wrench,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface LaudoTecnicoPrintEditorProps {
  orcamento: any
  itens: any[]
  onClose: () => void
}

interface TimbradoConfig {
  id?: number
  logo_url?: string
  cabecalho?: string
  rodape?: string
  empresa_nome?: string
  empresa_cnpj?: string
  empresa_endereco?: string
  empresa_cep?: string
  empresa_bairro?: string
  empresa_cidade?: string
  empresa_uf?: string
  empresa_telefone?: string
  empresa_email?: string
  empresa_representante_legal?: string
}

interface LogoConfig {
  id: number
  tipo: string
  nome: string
  dados?: string
  formato?: string
  tamanho?: number
  ativo: boolean
}

interface EquipamentoDanificado {
  id: string
  selecionado: boolean
  descricao: string
  quantidade: number
  codigo?: string
}

export function LaudoTecnicoPrintEditor({ orcamento, itens, onClose }: LaudoTecnicoPrintEditorProps) {
  const [timbradoConfig, setTimbradoConfig] = useState<TimbradoConfig | null>(null)
  const [logoImpressao, setLogoImpressao] = useState<LogoConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [clienteCompleto, setClienteCompleto] = useState<any>(null)

  // Dados do laudo
  const [dataSinistro, setDataSinistro] = useState("")
  const [relatorio, setRelatorio] = useState("")
  const [analiseTecnica, setAnaliseTecnica] = useState("")
  const [conclusao, setConclusao] = useState("É necessário substituição dos equipamentos para normalização do sistema.")
  const [equipamentosDanificados, setEquipamentosDanificados] = useState<EquipamentoDanificado[]>([])

  // Preview
  const [showPreview, setShowPreview] = useState(false)

  // Resize do modal
  const [modalSize, setModalSize] = useState({ width: 90, height: 90 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({
      width: (window.innerWidth * modalSize.width) / 100,
      height: (window.innerHeight * modalSize.height) / 100,
    })
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    let newWidth = startSize.width
    let newHeight = startSize.height

    if (resizeDirection.includes("e")) {
      newWidth = startSize.width + deltaX
    }
    if (resizeDirection.includes("w")) {
      newWidth = startSize.width - deltaX
    }
    if (resizeDirection.includes("s")) {
      newHeight = startSize.height + deltaY
    }
    if (resizeDirection.includes("n")) {
      newHeight = startSize.height - deltaY
    }

    const minWidth = window.innerWidth * 0.5
    const maxWidth = window.innerWidth * 0.98
    const minHeight = window.innerHeight * 0.5
    const maxHeight = window.innerHeight * 0.98

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

    setModalSize({
      width: (newWidth / window.innerWidth) * 100,
      height: (newHeight / window.innerHeight) * 100,
    })
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeDirection(null)
  }

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove)
      window.addEventListener("mouseup", handleResizeEnd)

      return () => {
        window.removeEventListener("mousemove", handleResizeMove)
        window.removeEventListener("mouseup", handleResizeEnd)
      }
    }
  }, [isResizing, startPos, startSize, resizeDirection])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [timbradoResponse, logoResponse] = await Promise.all([
          fetch("/api/timbrado-config"),
          fetch("/api/configuracoes/logos"),
        ])

        const timbradoResult = await timbradoResponse.json()
        if (timbradoResult.success && timbradoResult.data) {
          setTimbradoConfig(timbradoResult.data)
        }

        const logoResult = await logoResponse.json()
        if (logoResult.success && logoResult.data) {
          const logoImpressaoEncontrado = logoResult.data.find(
            (logo: LogoConfig) => logo.tipo === "impressao" && logo.ativo && logo.dados,
          )
          setLogoImpressao(logoImpressaoEncontrado || null)
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        toast({
          title: "Erro ao carregar",
          description: "Falha ao carregar configurações iniciais.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (orcamento?.cliente_id) {
      loadClienteCompleto()
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    // Inicializar equipamentos a partir dos itens do orçamento
    if (itens && itens.length > 0) {
      const equipamentos = itens.map((item) => ({
        id: item.id || item.produto_id,
        selecionado: true,
        descricao: item.produto?.descricao || item.produto_descricao || item.descricao_personalizada || "",
        quantidade: item.quantidade || 1,
        codigo: item.produto?.codigo || item.produto_codigo || "",
      }))
      setEquipamentosDanificados(equipamentos)
    }
  }, [itens])

  const loadClienteCompleto = async () => {
    if (!orcamento?.cliente_id) return

    try {
      const response = await fetch(`/api/clientes/${orcamento.cliente_id}`)
      const result = await response.json()
      if (result.success) {
        setClienteCompleto(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error)
    }
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-"
    try {
      const [year, month, day] = dateString.split("-")
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  const formatDateExtended = (dateString: string): string => {
    if (!dateString) return "-"
    try {
      const months = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
      ]
      const [year, month, day] = dateString.split("-")
      return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`
    } catch {
      return dateString
    }
  }

  const toggleEquipamento = (id: string) => {
    setEquipamentosDanificados(prev =>
      prev.map(eq => eq.id === id ? { ...eq, selecionado: !eq.selecionado } : eq)
    )
  }

  const updateEquipamentoDescricao = (id: string, descricao: string) => {
    setEquipamentosDanificados(prev =>
      prev.map(eq => eq.id === id ? { ...eq, descricao } : eq)
    )
  }

  const updateEquipamentoQuantidade = (id: string, quantidade: number) => {
    setEquipamentosDanificados(prev =>
      prev.map(eq => eq.id === id ? { ...eq, quantidade } : eq)
    )
  }

  const adicionarEquipamento = () => {
    const novoId = `novo-${Date.now()}`
    setEquipamentosDanificados(prev => [
      ...prev,
      { id: novoId, selecionado: true, descricao: "", quantidade: 1 }
    ])
  }

  const removerEquipamento = (id: string) => {
    setEquipamentosDanificados(prev => prev.filter(eq => eq.id !== id))
  }

  const equipamentosSelecionados = equipamentosDanificados.filter(eq => eq.selecionado && eq.descricao.trim())

  const handlePrint = () => {
    if (!dataSinistro) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe a data do sinistro.",
        variant: "destructive",
      })
      return
    }

    if (!relatorio.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o relatório do ocorrido.",
        variant: "destructive",
      })
      return
    }

    if (!analiseTecnica.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha a análise técnica.",
        variant: "destructive",
      })
      return
    }

    if (equipamentosSelecionados.length === 0) {
      toast({
        title: "Equipamentos obrigatórios",
        description: "Por favor, selecione ao menos um equipamento danificado.",
        variant: "destructive",
      })
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.",
        variant: "destructive",
      })
      return
    }

    const clienteEndereco = clienteCompleto?.endereco || orcamento.cliente_endereco || ""
    const clienteBairro = clienteCompleto?.bairro || orcamento.cliente_bairro || ""
    const clienteCep = clienteCompleto?.cep || orcamento.cliente_cep || ""
    const clienteCidade = clienteCompleto?.cidade || orcamento.cliente_cidade || ""
    const clienteEstado = clienteCompleto?.estado || orcamento.cliente_estado || ""
    const sindico = clienteCompleto?.sindico || orcamento.nome_adm || ""

    const dataAtual = new Date().toISOString().split("T")[0]

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laudo Técnico - ${orcamento.cliente_nome}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            
            .container {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              padding: 15mm 20mm;
              min-height: 297mm;
              display: flex;
              flex-direction: column;
              background: white;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            
            .logo {
              max-height: 60px;
              margin-bottom: 10px;
              object-fit: contain;
            }
            
            .company-header {
              font-size: 9px;
              margin-bottom: 8px;
              line-height: 1.3;
              text-align: center;
            }
            
            .destinatario {
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f5f5f5;
              border: 1px solid #ddd;
            }
            
            .destinatario-titulo {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 5px;
            }
            
            .destinatario-info {
              font-size: 10px;
              line-height: 1.4;
            }
            
            .destinatario-info p {
              margin: 2px 0;
            }
            
            .document-title {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            
            .section {
              margin-bottom: 15px;
            }
            
            .section-title {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            
            .section-content {
              text-align: justify;
              font-size: 11px;
              line-height: 1.5;
            }
            
            .equipamentos-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            .equipamentos-table th,
            .equipamentos-table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 10px;
            }
            
            .equipamentos-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            
            .equipamentos-table td.center {
              text-align: center;
            }
            
            .conclusao {
              margin-top: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border-left: 3px solid #000;
            }
            
            .assinatura {
              margin-top: 40px;
              text-align: right;
            }
            
            .assinatura-data {
              font-size: 11px;
              margin-bottom: 30px;
            }
            
            .assinatura-linha {
              border-top: 1px solid #000;
              width: 250px;
              margin-left: auto;
              padding-top: 5px;
              text-align: center;
              font-size: 10px;
            }
            
            .footer {
              margin-top: auto;
              padding-top: 15px;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 9px;
            }
            
            @page {
              margin: 10mm;
              size: A4 portrait;
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .container { 
                padding: 0; 
                max-width: none;
                min-height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Cabeçalho -->
            <div class="header">
              ${logoImpressao?.dados ? `<img src="${logoImpressao.dados}" alt="Logo" class="logo">` : ""}
              ${timbradoConfig?.cabecalho ? `<div class="company-header">${timbradoConfig.cabecalho}</div>` : `
                <div class="company-header">
                  ${timbradoConfig?.empresa_nome || ""}<br>
                  ${timbradoConfig?.empresa_endereco || ""} - ${timbradoConfig?.empresa_bairro || ""}<br>
                  ${timbradoConfig?.empresa_cidade || ""} - ${timbradoConfig?.empresa_uf || ""} - CEP: ${timbradoConfig?.empresa_cep || ""}<br>
                  Tel: ${timbradoConfig?.empresa_telefone || ""} - ${timbradoConfig?.empresa_email || ""}
                </div>
              `}
            </div>

            <!-- Destinatário -->
            <div class="destinatario">
              <div class="destinatario-titulo">AO</div>
              <div class="destinatario-info">
                <p><strong>${orcamento.cliente_nome}</strong></p>
                ${clienteEndereco ? `<p>${clienteEndereco}</p>` : ""}
                ${clienteCep ? `<p>CEP ${clienteCep}</p>` : ""}
                ${clienteBairro ? `<p>${clienteBairro}</p>` : ""}
                ${clienteCidade || clienteEstado ? `<p>${clienteCidade}${clienteEstado ? ` - ${clienteEstado}` : ""}</p>` : ""}
                ${sindico ? `<p><strong>A/C:</strong> ${sindico}</p>` : ""}
              </div>
            </div>

            <!-- Título -->
            <div class="document-title">LAUDO TÉCNICO</div>

            <!-- Relatório -->
            <div class="section">
              <div class="section-content">
                No dia <strong>${formatDate(dataSinistro)}</strong>, ${relatorio}
              </div>
            </div>

            <div class="section">
              <div class="section-content">
                Nossa equipe técnica iniciou os testes aos equipamentos que ficaram inoperantes, e foi detectado danos nos seguintes equipamentos:
              </div>
            </div>

            <!-- Lista numerada de equipamentos -->
            <div class="section">
              <ol style="margin-left: 20px; font-size: 11px;">
                ${equipamentosSelecionados.map((eq, index) => `
                  <li style="margin-bottom: 5px;">${eq.descricao}</li>
                `).join("")}
              </ol>
            </div>

            <div class="section">
              <div class="section-content">
                Após análise dos itens danificados, a ${timbradoConfig?.empresa_nome || "empresa"} declara que a(s) causa(s) para a(s) queima dos componentes do(s) equipamento(s) são:
              </div>
            </div>

            <!-- Análise Técnica -->
            <div class="section">
              <div class="section-title">ANÁLISE TÉCNICA</div>
              <div class="section-content">
                ${analiseTecnica.split("\n").map((line, index) => `
                  <p>${index + 1}. ${line}</p>
                `).join("")}
              </div>
            </div>

            <!-- Tabela de Equipamentos -->
            <div class="section">
              <div class="section-title">EQUIPAMENTOS:</div>
              <table class="equipamentos-table">
                <thead>
                  <tr>
                    <th style="width: 60px;">QT</th>
                    <th>DESCRIÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  ${equipamentosSelecionados.map(eq => `
                    <tr>
                      <td class="center">${eq.quantidade}</td>
                      <td>${eq.descricao}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Conclusão -->
            <div class="section conclusao">
              <div class="section-title">CONCLUSÃO FINAL</div>
              <div class="section-content">
                ${conclusao}
              </div>
            </div>

            <!-- Assinatura -->
            <div class="assinatura">
              <div class="assinatura-data">
                ${timbradoConfig?.empresa_cidade || "São Paulo"}, ${formatDate(dataAtual)}
              </div>
              <div class="assinatura-linha">
                ${timbradoConfig?.empresa_nome || ""}
              </div>
            </div>

            <!-- Rodapé -->
            ${timbradoConfig?.rodape ? `
              <div class="footer">
                ${timbradoConfig.rodape}
              </div>
            ` : `
              <div class="footer">
                ${timbradoConfig?.empresa_endereco || ""} - ${timbradoConfig?.empresa_telefone || ""} - ${timbradoConfig?.empresa_bairro || ""} - ${timbradoConfig?.empresa_cidade || ""}/${timbradoConfig?.empresa_uf || ""}
              </div>
            `}
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Carregando...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="overflow-hidden p-0 flex flex-col"
        style={{
          width: `${modalSize.width}vw`,
          height: `${modalSize.height}vh`,
          maxWidth: "98vw",
          maxHeight: "98vh",
        }}
      >
        {/* Resize Handles */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-n-resize hover:bg-blue-500/50 z-50"
          onMouseDown={(e) => handleResizeStart(e, "n")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize hover:bg-blue-500/50 z-50"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />
        <div
          className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize hover:bg-blue-500/50 z-50"
          onMouseDown={(e) => handleResizeStart(e, "w")}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize hover:bg-blue-500/50 z-50"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />

        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-orange-500 to-red-600 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <DialogTitle className="text-white text-lg">Laudo Técnico para Seguradora</DialogTitle>
                <DialogDescription className="text-orange-100">
                  Orçamento {orcamento.numero} - {orcamento.cliente_nome}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Formulário */}
          <div className="w-1/2 border-r flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Dados do Cliente (somente leitura) */}
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Dados do Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{orcamento.cliente_nome}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Endereço:</span>
                      <p className="font-medium">{clienteCompleto?.endereco || orcamento.cliente_endereco || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cidade:</span>
                      <p className="font-medium">
                        {clienteCompleto?.cidade || orcamento.cliente_cidade || "-"}
                        {(clienteCompleto?.estado || orcamento.cliente_estado) && ` - ${clienteCompleto?.estado || orcamento.cliente_estado}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CEP:</span>
                      <p className="font-medium">{clienteCompleto?.cep || orcamento.cliente_cep || "-"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Data do Sinistro */}
                <div className="space-y-2">
                  <Label htmlFor="dataSinistro" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data do Sinistro *
                  </Label>
                  <Input
                    id="dataSinistro"
                    type="date"
                    value={dataSinistro}
                    onChange={(e) => setDataSinistro(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                {/* Relatório */}
                <div className="space-y-2">
                  <Label htmlFor="relatorio" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Relatório do Ocorrido *
                  </Label>
                  <Textarea
                    id="relatorio"
                    placeholder="Ex: neste dia houve falta de energia por parte da concessionária Enel, devido esta falta de energia na região do condomínio, houve danos elétricos nos equipamentos."
                    value={relatorio}
                    onChange={(e) => setRelatorio(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    O texto será precedido por: &quot;No dia [DATA],&quot;
                  </p>
                </div>

                {/* Análise Técnica */}
                <div className="space-y-2">
                  <Label htmlFor="analiseTecnica" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Análise Técnica *
                  </Label>
                  <Textarea
                    id="analiseTecnica"
                    placeholder="Ex: Curto elétrico ocasionado por surto na rede&#10;Quando verificou-se a CPU estava inoperante"
                    value={analiseTecnica}
                    onChange={(e) => setAnaliseTecnica(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cada linha será numerada automaticamente
                  </p>
                </div>

                <Separator />

                {/* Equipamentos Danificados */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Equipamentos Danificados *</Label>
                    <Button variant="outline" size="sm" onClick={adicionarEquipamento}>
                      Adicionar Equipamento
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {equipamentosDanificados.map((equipamento, index) => (
                      <div key={equipamento.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                        <Checkbox
                          checked={equipamento.selecionado}
                          onCheckedChange={() => toggleEquipamento(equipamento.id)}
                        />
                        <div className="flex-1 grid grid-cols-[80px_1fr] gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={equipamento.quantidade}
                            onChange={(e) => updateEquipamentoQuantidade(equipamento.id, parseInt(e.target.value) || 1)}
                            className="h-8 text-center"
                            placeholder="Qtd"
                          />
                          <Input
                            value={equipamento.descricao}
                            onChange={(e) => updateEquipamentoDescricao(equipamento.id, e.target.value)}
                            className="h-8"
                            placeholder="Descrição do equipamento"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerEquipamento(equipamento.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {equipamentosDanificados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum equipamento adicionado. Clique em &quot;Adicionar Equipamento&quot; para incluir.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Conclusão */}
                <div className="space-y-2">
                  <Label htmlFor="conclusao">Conclusão Final</Label>
                  <Textarea
                    id="conclusao"
                    value={conclusao}
                    onChange={(e) => setConclusao(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Preview */}
          <div className="w-1/2 bg-slate-100 flex flex-col">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização
              </h3>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="bg-white shadow-lg mx-auto" style={{ width: "210mm", minHeight: "297mm", padding: "15mm 20mm" }}>
                {/* Header do Preview */}
                <div className="text-center border-b-2 border-black pb-4 mb-5">
                  {logoImpressao?.dados && (
                    <img src={logoImpressao.dados} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                  )}
                  {timbradoConfig?.cabecalho ? (
                    <div className="text-[9px] leading-tight" dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }} />
                  ) : (
                    <div className="text-[9px] leading-tight">
                      {timbradoConfig?.empresa_nome}<br />
                      {timbradoConfig?.empresa_endereco} - {timbradoConfig?.empresa_bairro}<br />
                      {timbradoConfig?.empresa_cidade} - {timbradoConfig?.empresa_uf}
                    </div>
                  )}
                </div>

                {/* Destinatário */}
                <div className="mb-5 p-3 bg-slate-50 border text-[10px]">
                  <div className="font-bold mb-1">AO</div>
                  <p className="font-bold">{orcamento.cliente_nome}</p>
                  <p>{clienteCompleto?.endereco || orcamento.cliente_endereco || ""}</p>
                  {(clienteCompleto?.cep || orcamento.cliente_cep) && (
                    <p>CEP {clienteCompleto?.cep || orcamento.cliente_cep}</p>
                  )}
                  <p>{clienteCompleto?.bairro || orcamento.cliente_bairro || ""}</p>
                  <p>
                    {clienteCompleto?.cidade || orcamento.cliente_cidade || ""}
                    {(clienteCompleto?.estado || orcamento.cliente_estado) && ` - ${clienteCompleto?.estado || orcamento.cliente_estado}`}
                  </p>
                  {(clienteCompleto?.sindico || orcamento.nome_adm) && (
                    <p><strong>A/C:</strong> {clienteCompleto?.sindico || orcamento.nome_adm}</p>
                  )}
                </div>

                {/* Título */}
                <h1 className="text-lg font-bold text-center uppercase border-b pb-3 mb-5">LAUDO TÉCNICO</h1>

                {/* Relatório */}
                <div className="text-[11px] leading-relaxed mb-4 text-justify">
                  {dataSinistro ? (
                    <p>No dia <strong>{formatDate(dataSinistro)}</strong>, {relatorio || "[relatório do ocorrido]"}</p>
                  ) : (
                    <p className="text-slate-400">[Informe a data do sinistro e o relatório]</p>
                  )}
                </div>

                <div className="text-[11px] leading-relaxed mb-4">
                  <p>Nossa equipe técnica iniciou os testes aos equipamentos que ficaram inoperantes, e foi detectado danos nos seguintes equipamentos:</p>
                </div>

                {/* Lista de equipamentos */}
                <ol className="ml-5 mb-4 text-[11px] list-decimal">
                  {equipamentosSelecionados.length > 0 ? (
                    equipamentosSelecionados.map((eq, index) => (
                      <li key={eq.id} className="mb-1">{eq.descricao}</li>
                    ))
                  ) : (
                    <li className="text-slate-400">[Selecione os equipamentos danificados]</li>
                  )}
                </ol>

                <div className="text-[11px] leading-relaxed mb-4">
                  <p>Após análise dos itens danificados, a {timbradoConfig?.empresa_nome || "[empresa]"} declara que a(s) causa(s) para a(s) queima dos componentes do(s) equipamento(s) são:</p>
                </div>

                {/* Análise Técnica */}
                <div className="mb-4">
                  <h2 className="text-xs font-bold uppercase mb-2">ANÁLISE TÉCNICA</h2>
                  <div className="text-[11px]">
                    {analiseTecnica ? (
                      analiseTecnica.split("\n").filter(line => line.trim()).map((line, index) => (
                        <p key={index} className="mb-1">{index + 1}. {line}</p>
                      ))
                    ) : (
                      <p className="text-slate-400">[Informe a análise técnica]</p>
                    )}
                  </div>
                </div>

                {/* Tabela de Equipamentos */}
                <div className="mb-4">
                  <h2 className="text-xs font-bold uppercase mb-2">EQUIPAMENTOS:</h2>
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-2 w-16 text-center">QT</th>
                        <th className="border border-black p-2 text-left">DESCRIÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipamentosSelecionados.length > 0 ? (
                        equipamentosSelecionados.map((eq) => (
                          <tr key={eq.id}>
                            <td className="border border-black p-2 text-center">{eq.quantidade}</td>
                            <td className="border border-black p-2">{eq.descricao}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="border border-black p-2 text-center text-slate-400">
                            [Nenhum equipamento selecionado]
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Conclusão */}
                <div className="mb-6 p-3 bg-slate-50 border-l-4 border-black">
                  <h2 className="text-xs font-bold uppercase mb-2">CONCLUSÃO FINAL</h2>
                  <p className="text-[11px]">{conclusao}</p>
                </div>

                {/* Assinatura */}
                <div className="text-right mt-10">
                  <p className="text-[11px] mb-8">
                    {timbradoConfig?.empresa_cidade || "São Paulo"}, {formatDate(new Date().toISOString().split("T")[0])}
                  </p>
                  <div className="border-t border-black w-64 ml-auto pt-1 text-center text-[10px]">
                    {timbradoConfig?.empresa_nome || ""}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {equipamentosSelecionados.length} equipamento(s) selecionado(s)
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Laudo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
