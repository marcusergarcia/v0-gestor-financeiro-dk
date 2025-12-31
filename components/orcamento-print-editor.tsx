"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Printer,
  X,
  Eye,
  Settings,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { OrcamentoPrintView } from "@/components/orcamento-print-view"
import { createRoot } from "react-dom/client"

interface OrcamentoPrintEditorProps {
  orcamento: any
  itens: any[]
  onClose: () => void
}

interface LayoutConfig {
  fontSize: number
  titleFontSize: number
  headerFontSize: number
  footerFontSize: number
  signatureFontSize: number
  lineHeight: number
  pageMargin: number
  marginTop: number
  marginBottom: number
  contentMarginTop: number
  contentMarginBottom: number
  showLogo: boolean
  showHeader: boolean
  showFooter: boolean
  logoSize: number
  pageBreaks: string[]
  customPageBreaks: string
  sectionTitleFontSize: number
}

interface SavedLayoutConfig {
  id: number
  nome: string
  tipo: string
  font_size: number
  title_font_size: number
  header_font_size: number
  footer_font_size: number
  signature_font_size: number
  line_height: number
  page_margin: number
  margin_top: number
  margin_bottom: number
  content_margin_top: number
  content_margin_bottom: number
  show_logo: boolean
  show_header: boolean
  show_footer: boolean
  logo_size: number
  custom_page_breaks: string | null
  ativo: boolean
  created_at: string
  updated_at: string
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
  representante_nacionalidade?: string
  representante_estado_civil?: string
  representante_rg?: string
  representante_cpf?: string
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

interface TermoOrcamento {
  id: number
  tipo: string
  titulo: string
  conteudo: string
  versao: string
  obrigatorio: boolean
  ativo: boolean
}

export function OrcamentoPrintEditor({ orcamento, onClose }: OrcamentoPrintEditorProps) {
  const [timbradoConfig, setTimbradoConfig] = useState<TimbradoConfig | null>(null)
  const [logoImpressao, setLogoImpressao] = useState<LogoConfig | null>(null)
  const [termoOrcamento, setTermoOrcamento] = useState<TermoOrcamento | null>(null)
  const [conteudoProcessado, setConteudoProcessado] = useState("")
  const [loading, setLoading] = useState(true)
  const [paginasPreview, setPaginasPreview] = useState<string[]>([])
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [savedConfigs, setSavedConfigs] = useState<SavedLayoutConfig[]>([])
  const [selectedConfigId, setSelectedConfigId] = useState<string>("")
  const [saveConfigName, setSaveConfigName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [clienteCompleto, setClienteCompleto] = useState<any>(null)

  const [modalSize, setModalSize] = useState({ width: 90, height: 85 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    fontSize: 11,
    titleFontSize: 16,
    headerFontSize: 10,
    footerFontSize: 9,
    signatureFontSize: 10,
    lineHeight: 1.5,
    pageMargin: 15,
    marginTop: 10,
    marginBottom: 10,
    contentMarginTop: 8,
    contentMarginBottom: 8,
    showLogo: true,
    showHeader: true,
    showFooter: true,
    logoSize: 50,
    pageBreaks: ["Serviços a serem realizados", "Condições Gerais"],
    customPageBreaks: "Serviços a serem realizados\nCondições Gerais",
    sectionTitleFontSize: 14,
  })

  const getClienteInfoForDisplay = () => {
    return {
      endereco: clienteCompleto?.endereco || orcamento.cliente_endereco,
      bairro: clienteCompleto?.bairro || orcamento.cliente_bairro,
      cidade: clienteCompleto?.cidade || orcamento.cliente_cidade,
      estado: clienteCompleto?.estado || orcamento.cliente_estado,
      sindico: clienteCompleto?.representante_legal || orcamento.cliente_representante_legal,
    }
  }

  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const calcularSubtotalMdo = () => {
    if (!orcamento) return 0

    if (orcamento.subtotal_mdo) {
      return safeNumber(orcamento.subtotal_mdo)
    }

    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    if (parcelamentoMdo === 0) {
      return 0
    }

    const valorMaoObra = safeNumber(orcamento.valor_mao_obra)
    const descontoMdoValor = safeNumber(orcamento.desconto_mdo_valor)
    const custoDeslocamento = safeNumber(orcamento.custo_deslocamento)
    const taxaBoletoMdo = safeNumber(orcamento.taxa_boleto_mdo)
    const impostoServicoValor = safeNumber(orcamento.imposto_servico)

    return valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo + impostoServicoValor
  }

  const calcularSubtotalMaterial = () => {
    if (!orcamento) return 0

    if (orcamento.subtotal_material) {
      return safeNumber(orcamento.subtotal_material)
    }

    const valorMaterial = safeNumber(orcamento.valor_material)
    const valorJuros = safeNumber(orcamento.valor_juros)
    const taxaBoletoMaterial = safeNumber(orcamento.taxa_boleto_material)
    const impostoMaterialValor = safeNumber(orcamento.imposto_material)

    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    const custoDeslocamentoExtra = parcelamentoMdo === 0 ? safeNumber(orcamento.custo_deslocamento) : 0

    return valorMaterial + valorJuros + taxaBoletoMaterial + impostoMaterialValor + custoDeslocamentoExtra
  }

  const gerarTextoParcelamento = () => {
    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material) || 1
    const materialAVista = orcamento.material_a_vista === true || orcamento.material_a_vista === 1
    const subtotalMdo = calcularSubtotalMdo()
    const subtotalMaterial = calcularSubtotalMaterial()

    const valorParcelaMdo = subtotalMdo / parcelamentoMdo
    const valorParcelaMaterial = subtotalMaterial / parcelamentoMaterial

    let texto = "Parcelamento: "

    if (parcelamentoMdo === 0) {
      texto += "Mão de Obra: Sem cobrança"
    } else if (parcelamentoMdo === 1) {
      texto += `Mão de Obra: À vista ${formatCurrency(subtotalMdo)}`
    } else {
      // Generate payment schedule starting from cash (0dd), then 30dd, 60dd, etc.
      const parcelasMdo = []
      for (let i = 0; i < parcelamentoMdo; i++) {
        parcelasMdo.push(i === 0 ? "À vista" : `${i * 30}dd`)
      }
      texto += `Mão de Obra: ${parcelamentoMdo}x ${formatCurrency(valorParcelaMdo)} (${parcelasMdo.join(", ")})`
    }

    texto += " e "

    if (materialAVista) {
      texto += `Material: À vista ${formatCurrency(subtotalMaterial)}`
    } else if (parcelamentoMaterial === 0) {
      texto += "Material: Sem cobrança"
    } else if (parcelamentoMaterial === 1) {
      // Material starts after last MDO payment
      const inicioMaterial = parcelamentoMdo * 30
      texto += `Material: ${inicioMaterial}dd ${formatCurrency(subtotalMaterial)}`
    } else {
      // Material starts after the last MDO payment
      const inicioMaterial = parcelamentoMdo * 30
      const parcelasMaterial = []
      for (let i = 0; i < parcelamentoMaterial; i++) {
        parcelasMaterial.push(`${inicioMaterial + i * 30}dd`)
      }
      texto += `Material: ${parcelamentoMaterial}x ${formatCurrency(valorParcelaMaterial)} (${parcelasMaterial.join(", ")})`
    }

    return texto
  }

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
      if (!orcamento) return

      try {
        const [timbradoResponse, logoResponse, termosResponse] = await Promise.all([
          fetch("/api/timbrado-config"),
          fetch("/api/configuracoes/logos"),
          fetch("/api/configuracoes/termos"),
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

        const termosResult = await termosResponse.json()
        if (termosResult.success && termosResult.data) {
          const termoOrcamentoAtivo = termosResult.data.find(
            (termo: TermoOrcamento) => termo.tipo === "orcamento" && termo.ativo,
          )
          setTermoOrcamento(termoOrcamentoAtivo || null)
        }

        // Buscar apenas configurações do tipo "orcamento"
        const layoutResponse = await fetch("/api/configuracoes/layout-impressao?tipo=orcamento")
        if (layoutResponse.ok) {
          const layoutResult = await layoutResponse.json()
          const sortedConfigs = layoutResult.sort((a: SavedLayoutConfig, b: SavedLayoutConfig) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime()
            const dateB = new Date(b.updated_at || b.created_at).getTime()
            return dateB - dateA
          })

          setSavedConfigs(sortedConfigs)

          if (sortedConfigs.length > 0) {
            const ultimaConfig = sortedConfigs[0]
            loadSavedConfig(ultimaConfig)
            setSelectedConfigId(ultimaConfig.id.toString())
          }
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        toast({
          title: "Erro ao carregar",
          description: "Falha ao carregar configurações iniciais do layout.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (orcamento?.cliente_id && !clienteCompleto) {
      loadClienteCompleto()
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (timbradoConfig && termoOrcamento && orcamento && !conteudoProcessado) {
      processarConteudo()
    }
  }, [timbradoConfig, termoOrcamento, orcamento])

  useEffect(() => {
    if (conteudoProcessado && conteudoProcessado.length > 0) {
      const paginas = dividirConteudoEmPaginas(conteudoProcessado)
      setPaginasPreview(paginas)
      setPaginaAtual(0)
    }
  }, [conteudoProcessado, layoutConfig.customPageBreaks])

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

  const processarConteudo = () => {
    if (!termoOrcamento?.conteudo || !timbradoConfig || !orcamento) return

    let conteudo = termoOrcamento.conteudo

    // Variáveis da empresa
    conteudo = conteudo.replace(/\[EMPRESA_NOME\]/g, timbradoConfig.empresa_nome || "")
    conteudo = conteudo.replace(/\[EMPRESA_CNPJ\]/g, timbradoConfig.empresa_cnpj || "")
    conteudo = conteudo.replace(/\[EMPRESA_ENDERECO\]/g, timbradoConfig.empresa_endereco || "")
    conteudo = conteudo.replace(/\[EMPRESA_CEP\]/g, timbradoConfig.empresa_cep || "")
    conteudo = conteudo.replace(/\[EMPRESA_BAIRRO\]/g, timbradoConfig.empresa_bairro || "")
    conteudo = conteudo.replace(/\[EMPRESA_CIDADE\]/g, timbradoConfig.empresa_cidade || "")
    conteudo = conteudo.replace(/\[EMPRESA_UF\]/g, timbradoConfig.empresa_uf || "")
    conteudo = conteudo.replace(/\[EMPRESA_TELEFONE\]/g, timbradoConfig.empresa_telefone || "")
    conteudo = conteudo.replace(/\[EMPRESA_EMAIL\]/g, timbradoConfig.empresa_email || "")

    // Variáveis do cliente
    conteudo = conteudo.replace(/\[CLIENTE_NOME\]/g, orcamento.cliente_nome || "")
    conteudo = conteudo.replace(/\[CLIENTE_CNPJ\]/g, orcamento.cliente_cnpj || orcamento.cliente_cpf || "")
    conteudo = conteudo.replace(/\[CLIENTE_ENDERECO\]/g, orcamento.cliente_endereco || "")
    conteudo = conteudo.replace(/\[CLIENTE_CIDADE\]/g, orcamento.cliente_cidade || "")
    conteudo = conteudo.replace(/\[CLIENTE_ESTADO\]/g, orcamento.cliente_estado || "")
    conteudo = conteudo.replace(/\[CLIENTE_EMAIL\]/g, orcamento.cliente_email || "")
    conteudo = conteudo.replace(/\[CLIENTE_TELEFONE\]/g, orcamento.cliente_telefone || "")

    // Variáveis do orçamento
    conteudo = conteudo.replace(/\[ORCAMENTO_NUMERO\]/g, orcamento.numero || "")
    conteudo = conteudo.replace(/\[ORCAMENTO_DATA\]/g, formatDate(orcamento.data_orcamento) || "")
    conteudo = conteudo.replace(/\[ORCAMENTO_VALIDADE\]/g, calcularDataValidade() || "")
    conteudo = conteudo.replace(/\[TIPO_SERVICO\]/g, orcamento.tipo_servico || "")
    const detalhesServico = (orcamento.detalhes_servico || "").replace(/\n/g, "<br>")
    conteudo = conteudo.replace(/\[DETALHES_SERVICO\]/g, detalhesServico)

    const observacoes = (orcamento.observacoes || "").replace(/\n/g, "<br>")
    conteudo = conteudo.replace(/\[OBSERVACOES\]/g, observacoes)

    // Valores
    const valorTotal = orcamento.valor_total || 0
    const valorFormatado = formatCurrency(valorTotal)
    conteudo = conteudo.replace(/\[VALOR_TOTAL\]/g, valorFormatado)
    conteudo = conteudo.replace(/\[VALOR_MATERIAL\]/g, formatCurrency(orcamento.valor_material || 0))
    conteudo = conteudo.replace(/\[VALOR_MAO_OBRA\]/g, formatCurrency(orcamento.valor_mao_obra || 0))

    // Processar lista de produtos
    let produtosTexto = ""
    if (orcamento.itens && orcamento.itens.length > 0) {
      produtosTexto = orcamento.itens
        .map((item: any, index: number) => {
          return `${index + 1}. ${item.produto_descricao} - Qtd: ${item.quantidade} - ${formatCurrency(item.valor_total)}`
        })
        .join("\n")
    } else {
      produtosTexto = "Nenhum produto incluído"
    }

    conteudo = conteudo.replace(/\[LISTA_PRODUTOS\]/g, produtosTexto)

    // Gerar tabela HTML de produtos
    let tabelaProdutosHTML = `
<div style="margin: 12px 0;">
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
    <thead>
      <tr style="background-color: #f0f0f0;">
        <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Item</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Código</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Marca</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Qtd</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: left; font-weight: bold; font-size: 9px;">Descrição</th>
      </tr>
    </thead>
    <tbody>
`

    if (orcamento.itens && orcamento.itens.length > 0) {
      orcamento.itens.forEach((item: any, index: number) => {
        tabelaProdutosHTML += `
      <tr>
        <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px;">${item.produto_codigo || "-"}</td>
        <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px;">${item.marca_nome || "Sem marca"}</td>
        <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px;">${item.quantidade}</td>
        <td style="border: 1px solid #000; padding: 3px; font-size: 9px; line-height: 1.2;">${item.produto_descricao}</td>
      </tr>
    `
      })
    } else {
      tabelaProdutosHTML += `
    <tr>
      <td colspan="5" style="border: 1px solid #000; padding: 3px; text-align: center; color: #666; font-size: 9px;">Nenhum produto incluído</td>
    </tr>
  `
    }

    tabelaProdutosHTML += `
    </tbody>
  </table>
</div>
`

    const descontoValor = Number(orcamento.desconto_mdo_valor) || 0
    const descontoPercent = Number(orcamento.desconto_mdo_percent) || 0
    const subtotalMdo = calcularSubtotalMdo()
    const subtotalMaterial = calcularSubtotalMaterial()
    const textoParcelamento = gerarTextoParcelamento()

    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material) || 1
    const materialAVista = orcamento.material_a_vista === true || orcamento.material_a_vista === 1

    let textoMdo = "À vista"
    if (parcelamentoMdo === 0) {
      textoMdo = "Sem cobrança"
    } else if (parcelamentoMdo > 1) {
      const parcelasMdo = []
      for (let i = 0; i < parcelamentoMdo; i++) {
        parcelasMdo.push(i === 0 ? "À vista" : `${i * 30}dd`)
      }
      textoMdo = `${parcelamentoMdo}x (${parcelasMdo.join(", ")})`
    }

    const inicioMaterial = parcelamentoMdo * 30
    let textoMaterial = "À vista"
    if (materialAVista) {
      textoMaterial = "À vista"
    } else if (parcelamentoMaterial === 0) {
      textoMaterial = "Sem cobrança"
    } else if (parcelamentoMaterial === 1) {
      textoMaterial = `${inicioMaterial}dd`
    } else {
      const parcelasMaterial = []
      for (let i = 0; i < parcelamentoMaterial; i++) {
        parcelasMaterial.push(`${inicioMaterial + i * 30}dd`)
      }
      textoMaterial = `${parcelamentoMaterial}x (${parcelasMaterial.join(", ")})`
    }

    tabelaProdutosHTML += `
<div style="margin-top: 6px;">
  ${descontoPercent > 0 ? `<p style="color: #dc2626; font-weight: bold; margin-bottom: 2px; font-size: 12px;">Desconto (${descontoPercent.toFixed(2)}%): - ${formatCurrency(descontoValor)}</p>` : ""}
  <p style="font-weight: bold; margin-bottom: 2px; font-size: 12px;">Subtotal MDO: ${formatCurrency(subtotalMdo)}</p>
  <p style="font-weight: bold; font-size: 12px;">Subtotal Material: ${formatCurrency(subtotalMaterial)}</p>
</div>

<div style="margin-top: 8px; border: 1px solid #000; padding: 8px;">
  <div style="text-align: center; margin-bottom: 6px;">
    <p style="font-weight: bold; font-size: 16px; color: #16a34a; margin-bottom: 2px;">Total: ${formatCurrency(valorTotal)}</p>
    <p style="color: #2563eb; font-size: 11px; font-weight: 500;">${textoParcelamento}</p>
  </div>
  
  <div style="border-top: 1px solid #000; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px;">
    <div style="padding-right: 6px;">
      <p style="margin-bottom: 2px;"><strong>Validade:</strong> ${calcularDataValidade()}</p>
      ${orcamento.prazo_dias ? `<p style="margin-bottom: 2px;"><strong>Prazo:</strong> ${orcamento.prazo_dias} dias úteis</p>` : ""}
      <p style="margin-bottom: 2px;"><strong>Mão de obra:</strong> ${textoMdo}</p>
      <p style="margin-bottom: 2px;"><strong>Material:</strong> ${textoMaterial}</p>
      <p style="margin-bottom: 2px;"><strong>Garantia:</strong> 90d serviços / 180d materiais</p>
      <p style="margin-bottom: 0;"><strong>Não inclui:</strong> Obras civis, pintura, limpeza</p>
    </div>
    
    <div style="padding-left: 6px; border-left: 1px solid #ccc;">
      <h4 style="font-weight: bold; margin-bottom: 4px; text-decoration: underline; font-size: 11px;">Dados da Empresa</h4>
      ${timbradoConfig?.empresa_nome ? `<p style="margin-bottom: 2px;"><strong>Empresa:</strong> ${timbradoConfig.empresa_nome}</p>` : ""}
      ${timbradoConfig?.empresa_cnpj ? `<p style="margin-bottom: 2px;"><strong>CNPJ:</strong> ${timbradoConfig.empresa_cnpj}</p>` : ""}
      ${timbradoConfig?.empresa_endereco ? `<p style="margin-bottom: 2px;"><strong>End.:</strong> ${timbradoConfig.empresa_endereco}</p>` : ""}
      ${timbradoConfig?.empresa_cidade && timbradoConfig?.empresa_uf ? `<p style="margin-bottom: 0;"><strong>Cidade:</strong> ${timbradoConfig.empresa_cidade}/${timbradoConfig.empresa_uf}</p>` : ""}
    </div>
  </div>
</div>
`

    const regex14 = /(1\.4[^<]*(?:Relação|relação)[^<]*(?:equipamentos|Equipamentos)[^<]*)/i
    if (regex14.test(conteudo)) {
      const match = conteudo.match(regex14)
      if (match && match.index !== undefined) {
        const posicaoInicial = match.index + match[0].length
        const proximaSecaoRegex = /(?:<\/p>|<br>|\n\n)/
        const restanteConteudo = conteudo.substring(posicaoInicial)
        const matchProximaSecao = restanteConteudo.match(proximaSecaoRegex)

        if (matchProximaSecao && matchProximaSecao.index !== undefined) {
          const posicaoInsercao = posicaoInicial + matchProximaSecao.index + matchProximaSecao[0].length
          conteudo =
            conteudo.substring(0, posicaoInsercao) +
            "\n\n" +
            tabelaProdutosHTML +
            "\n\n" +
            conteudo.substring(posicaoInsercao)
        } else {
          const posicaoInsercao = posicaoInicial
          conteudo =
            conteudo.substring(0, posicaoInsercao) +
            "\n\n" +
            tabelaProdutosHTML +
            "\n\n" +
            conteudo.substring(posicaoInsercao)
        }
      } else {
        conteudo += "\n\n" + tabelaProdutosHTML + "\n\n"
      }
    } else {
      conteudo += "\n\n" + tabelaProdutosHTML + "\n\n"
    }

    setConteudoProcessado(conteudo)
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-"

    try {
      const dateOnly = dateString.split("T")[0].trim()
      const parts = dateOnly.split("-")
      if (parts.length !== 3) return "-"

      const [year, month, day] = parts

      if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
        return "-"
      }

      return `${day}/${month}/${year}`
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString)
      return "-"
    }
  }

  const calcularDataValidade = () => {
    if (!orcamento) return ""

    try {
      const dataOrcamentoStr = orcamento.data_orcamento.split("T")[0]
      const [year, month, day] = dataOrcamentoStr.split("-").map(Number)

      const diasValidade = 30
      const totalDias = day + diasValidade

      const dataValidade = new Date(year, month - 1, totalDias)

      const validadeDay = String(dataValidade.getDate()).padStart(2, "0")
      const validadeMonth = String(dataValidade.getMonth() + 1).padStart(2, "0")
      const validadeYear = dataValidade.getFullYear()

      return `${validadeDay}/${validadeMonth}/${validadeYear}`
    } catch (error) {
      console.error("Erro ao calcular data de validade:", error)
      return "-"
    }
  }

  const dataParaExtenso = (dataString: string): string => {
    if (!dataString) return ""

    const meses = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ]

    const data = new Date(dataString + "T00:00:00")
    const dia = data.getDate()
    const mes = data.getMonth()
    const ano = data.getFullYear()

    return `${dia} de ${meses[mes]} de ${ano}`
  }

  const dividirConteudoEmPaginas = (conteudo: string) => {
    if (!conteudo.trim()) return []

    const quebras = layoutConfig.customPageBreaks
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)

    if (quebras.length === 0) {
      return [conteudo]
    }

    const paginas: string[] = []
    let posicaoAtual = 0

    const encontrarInicioTag = (html: string, posTexto: number): number => {
      let pos = posTexto
      while (pos > 0 && html[pos] !== "<") {
        pos--
      }
      return pos
    }

    const encontrarFimTag = (html: string, posTexto: number, textoQuebra: string): number => {
      let pos = posTexto + textoQuebra.length
      let nivelTags = 0

      while (pos < html.length) {
        if (html[pos] === "<") {
          if (html[pos + 1] === "/") {
            nivelTags--
            if (nivelTags <= 0) {
              while (pos < html.length && html[pos] !== ">") {
                pos++
              }
              return pos + 1
            }
          } else {
            nivelTags++
          }
        }
        pos++
      }
      return posTexto + textoQuebra.length
    }

    const primeiraQuebra = quebras[0]
    const posPrimeiraQuebra = conteudo.indexOf(primeiraQuebra)

    if (posPrimeiraQuebra !== -1) {
      const inicioTag = encontrarInicioTag(conteudo, posPrimeiraQuebra)
      paginas.push(conteudo.substring(0, inicioTag).trim())
      posicaoAtual = inicioTag
    } else {
      return [conteudo]
    }

    for (let i = 0; i < quebras.length - 1; i++) {
      const quebraAtual = quebras[i]
      const proximaQuebra = quebras[i + 1]

      const posQuebraAtual = conteudo.indexOf(quebraAtual, posicaoAtual)

      if (posQuebraAtual === -1) continue

      const inicioTagAtual = encontrarInicioTag(conteudo, posQuebraAtual)
      const posProximaQuebra = conteudo.indexOf(proximaQuebra, posQuebraAtual + quebraAtual.length)

      if (posProximaQuebra !== -1) {
        const inicioProximaTag = encontrarInicioTag(conteudo, posProximaQuebra)
        const paginaConteudo = conteudo.substring(inicioTagAtual, inicioProximaTag).trim()
        paginas.push(paginaConteudo)
        posicaoAtual = inicioProximaTag
      } else {
        const fimTagAtual = encontrarFimTag(conteudo, posQuebraAtual, quebraAtual)
        const paginaConteudo = conteudo.substring(inicioTagAtual, conteudo.length).trim()
        paginas.push(paginaConteudo)
        posicaoAtual = conteudo.length
        break
      }
    }

    if (posicaoAtual < conteudo.length) {
      const ultimaQuebra = quebras[quebras.length - 1]
      const posUltimaQuebra = conteudo.indexOf(ultimaQuebra, posicaoAtual)

      if (posUltimaQuebra !== -1) {
        const inicioUltimaTag = encontrarInicioTag(conteudo, posUltimaQuebra)
        const ultimaPagina = conteudo.substring(inicioUltimaTag).trim()
        if (ultimaPagina) {
          paginas.push(ultimaPagina)
        }
      }
    }

    return paginas.filter((p) => p.length > 0)
  }

  const gerarCabecalho = () => {
    if (!layoutConfig.showHeader && !layoutConfig.showLogo) return ""

    const logoSrc = logoImpressao?.dados || timbradoConfig?.logo_url || ""

    return `
      <div class="page-header">
        ${
          layoutConfig.showLogo && logoSrc
            ? `
          <div class="logo">
            <img src="${logoSrc}" alt="Logo da Empresa" style="max-height: ${layoutConfig.logoSize}px;" />
          </div>
        `
            : ""
        }
        
        ${
          layoutConfig.showHeader && timbradoConfig?.cabecalho
            ? `
          <div class="cabecalho-personalizado">
            ${timbradoConfig.cabecalho}
          </div>
        `
            : ""
        }
      </div>
    `
  }

  const gerarRodape = () => {
    return layoutConfig.showFooter && timbradoConfig?.rodape
      ? `
      <div class="page-footer">
        ${timbradoConfig.rodape}
      </div>
    `
      : ""
  }

  const handleVisualizarCompleto = () => {
    const newWindow = window.open("", "_blank", "width=1200,height=800")
    if (!newWindow) {
      toast({
        title: "Erro de permissão",
        description: "Não foi possível abrir a janela de visualização. Verifique se há bloqueadores de pop-up.",
        variant: "destructive",
      })
      return
    }

    newWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orçamento ${orcamento.numero} - Visualização Completa</title>
        <style>
          body { margin: 0; padding: 20px; background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `)
    newWindow.document.close()

    const rootElement = newWindow.document.getElementById("root")
    if (rootElement) {
      const root = createRoot(rootElement)
      root.render(
        <OrcamentoPrintView
          orcamento={orcamento}
          timbradoConfig={timbradoConfig}
          logoImpressao={logoImpressao}
          layoutConfig={layoutConfig}
          paginasPreview={paginasPreview}
          clienteCompleto={clienteCompleto}
          onClose={() => newWindow.close()}
        />,
      )
    }
  }

  const handleImprimir = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800")
    if (!printWindow) {
      toast({
        title: "Erro de permissão",
        description: "Não foi possível abrir a janela de impressão. Verifique se há bloqueadores de pop-up.",
        variant: "destructive",
      })
      return
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orçamento ${orcamento.numero}</title>
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `)
    printWindow.document.close()

    const rootElement = printWindow.document.getElementById("root")
    if (rootElement) {
      const root = createRoot(rootElement)
      root.render(
        <OrcamentoPrintView
          orcamento={orcamento}
          timbradoConfig={timbradoConfig}
          logoImpressao={logoImpressao}
          layoutConfig={layoutConfig}
          paginasPreview={paginasPreview}
          clienteCompleto={clienteCompleto}
          onClose={() => printWindow.close()}
        />,
      )

      setTimeout(() => {
        printWindow.print()
      }, 1000)
    }
  }

  const updateLayoutConfig = (key: keyof LayoutConfig, value: any) => {
    setLayoutConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetToDefaults = () => {
    setLayoutConfig({
      fontSize: 11,
      titleFontSize: 16,
      headerFontSize: 10,
      footerFontSize: 9,
      signatureFontSize: 10,
      lineHeight: 1.5,
      pageMargin: 15,
      marginTop: 10,
      marginBottom: 10,
      contentMarginTop: 8,
      contentMarginBottom: 8,
      showLogo: true,
      showHeader: true,
      showFooter: true,
      logoSize: 50,
      pageBreaks: ["Serviços a serem realizados", "Condições Gerais"],
      customPageBreaks: "Serviços a serem realizados\nCondições Gerais",
      sectionTitleFontSize: 14,
    })
    setSelectedConfigId("")
    toast({
      title: "Configurações restauradas",
      description: "Configurações restauradas para o padrão",
    })
  }

  const updateCustomPageBreaks = (value: string) => {
    updateLayoutConfig("customPageBreaks", value)
    updateLayoutConfig(
      "pageBreaks",
      value.split("\n").filter((q) => q.trim()),
    )
  }

  const loadSavedConfig = (config: SavedLayoutConfig) => {
    const customPageBreaks = config.custom_page_breaks || "Serviços a serem realizados\nCondições Gerais"

    setLayoutConfig({
      fontSize: config.font_size,
      titleFontSize: config.title_font_size,
      headerFontSize: config.header_font_size,
      footerFontSize: config.footer_font_size,
      signatureFontSize: config.signature_font_size,
      lineHeight: config.line_height,
      pageMargin: config.page_margin,
      marginTop: config.margin_top,
      marginBottom: config.margin_bottom,
      contentMarginTop: config.content_margin_top || 8,
      contentMarginBottom: config.content_margin_bottom || 8,
      showLogo: config.show_logo,
      showHeader: config.show_header,
      showFooter: config.show_footer,
      logoSize: config.logo_size,
      customPageBreaks: customPageBreaks,
      pageBreaks: customPageBreaks.split("\n").filter(Boolean),
      sectionTitleFontSize: config.title_font_size > 12 ? config.title_font_size * 0.875 : 14,
    })
    setSelectedConfigId(config.id.toString())
    toast({
      title: "Configuração carregada",
      description: `Layout "${config.nome}" carregado com sucesso.`,
    })
  }

  const handleLoadConfig = (id: string) => {
    if (!id) {
      setSelectedConfigId("")
      return
    }
    const config = savedConfigs.find((c) => c.id.toString() === id)
    if (config) {
      loadSavedConfig(config)
    }
  }

  const handleSaveConfig = async () => {
    if (!saveConfigName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome para a configuração.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/configuracoes/layout-impressao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: saveConfigName,
          tipo: "orcamento",
          font_size: layoutConfig.fontSize,
          title_font_size: layoutConfig.titleFontSize,
          header_font_size: layoutConfig.headerFontSize,
          footer_font_size: layoutConfig.footerFontSize,
          signature_font_size: layoutConfig.signatureFontSize,
          line_height: layoutConfig.lineHeight,
          page_margin: layoutConfig.pageMargin,
          margin_top: layoutConfig.marginTop,
          margin_bottom: layoutConfig.marginBottom,
          content_margin_top: layoutConfig.contentMarginTop,
          content_margin_bottom: layoutConfig.contentMarginBottom,
          show_logo: layoutConfig.showLogo,
          show_header: layoutConfig.showHeader,
          show_footer: layoutConfig.showFooter,
          logo_size: layoutConfig.logoSize,
          custom_page_breaks: layoutConfig.customPageBreaks,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newConfig = result.data || result

        if (newConfig && newConfig.id) {
          setSavedConfigs([...savedConfigs, newConfig])
          setSelectedConfigId(newConfig.id.toString())
          setSaveConfigName("")
          setShowSaveDialog(false)
          toast({
            title: "Configuração salva",
            description: `Layout "${saveConfigName}" salvo com sucesso como configuração de orçamento.`,
          })
        } else {
          console.error("Resposta da API sem id:", result)
          toast({
            title: "Configuração salva",
            description: `Layout "${saveConfigName}" foi salvo, mas não foi possível carregar automaticamente.`,
          })
          setSaveConfigName("")
          setShowSaveDialog(false)
          const layoutResponse = await fetch("/api/configuracoes/layout-impressao?tipo=orcamento")
          if (layoutResponse.ok) {
            const layoutConfigs = await layoutResponse.json()
            setSavedConfigs(layoutConfigs)
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Erro ao salvar:", errorData)
        toast({
          title: "Erro ao salvar",
          description: errorData.error || "Ocorreu um erro ao salvar a configuração.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro de rede ao salvar a configuração.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfig = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a configuração "${nome}"?`)) return

    try {
      const response = await fetch(`/api/configuracoes/layout-impressao/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSavedConfigs(savedConfigs.filter((config) => config.id !== id))
        if (selectedConfigId === id.toString()) {
          setSelectedConfigId("")
          resetToDefaults()
        }
        toast({
          title: "Configuração excluída",
          description: `Layout "${nome}" excluído com sucesso.`,
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Erro ao excluir:", errorData)
        toast({
          title: "Erro ao excluir",
          description: errorData.error || "Ocorreu um erro ao excluir a configuração.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir configuração:", error)
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro de rede ao excluir a configuração.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateConfig = async () => {
    if (!selectedConfigId) {
      toast({
        title: "Nenhuma configuração selecionada",
        description: "Selecione uma configuração para atualizar.",
        variant: "destructive",
      })
      return
    }

    const configToUpdate = savedConfigs.find((c) => c.id.toString() === selectedConfigId)
    if (!configToUpdate) {
      toast({
        title: "Configuração não encontrada",
        description: "A configuração selecionada não pôde ser encontrada.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/configuracoes/layout-impressao/${selectedConfigId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: configToUpdate.nome,
          tipo: "orcamento",
          font_size: layoutConfig.fontSize,
          title_font_size: layoutConfig.titleFontSize,
          header_font_size: layoutConfig.headerFontSize,
          footer_font_size: layoutConfig.footerFontSize,
          signature_font_size: layoutConfig.signatureFontSize,
          line_height: layoutConfig.lineHeight,
          page_margin: layoutConfig.pageMargin,
          margin_top: layoutConfig.marginTop,
          margin_bottom: layoutConfig.marginBottom,
          content_margin_top: layoutConfig.contentMarginTop,
          content_margin_bottom: layoutConfig.contentMarginBottom,
          show_logo: layoutConfig.showLogo,
          show_header: layoutConfig.showHeader,
          show_footer: layoutConfig.showFooter,
          logo_size: layoutConfig.logoSize,
          custom_page_breaks: layoutConfig.customPageBreaks,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        setSavedConfigs(
          savedConfigs.map((config) =>
            config.id.toString() === selectedConfigId
              ? { ...config, ...result.data, updated_at: new Date().toISOString() }
              : config,
          ),
        )

        toast({
          title: "Configuração atualizada",
          description: `Layout "${configToUpdate.nome}" atualizado com sucesso.`,
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Erro ao atualizar:", errorData)
        toast({
          title: "Erro ao atualizar",
          description: errorData.error || "Ocorreu um erro ao atualizar a configuração.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro de rede ao atualizar a configuração.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
            <DialogDescription>Aguarde enquanto carregamos as configurações de layout</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!termoOrcamento) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Termo de Orçamento não encontrado</DialogTitle>
            <DialogDescription>
              Configure um termo do tipo "Orçamento" antes de usar o editor de layout
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-gray-600 mb-4">Nenhum termo do tipo "Orçamento" foi encontrado nas configurações.</p>
            <p className="text-sm text-gray-500">
              Por favor, crie um termo do tipo "Orçamento" na página de Configurações → Termos.
            </p>
            <Button onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="overflow-hidden p-0 border-4 border-blue-500"
        style={{
          width: `${modalSize.width}vw`,
          height: `${modalSize.height}vh`,
          maxWidth: "98vw",
          maxHeight: "98vh",
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-2 cursor-n-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "n")}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />
        <div
          className="absolute top-0 left-0 w-2 h-full cursor-w-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "w")}
        />
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />

        <div className="h-full overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editor de Layout - Orçamento {orcamento.numero}
            </DialogTitle>
            <DialogDescription>
              Personalize o layout de impressão do orçamento ajustando fontes, margens e quebras de página
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Configurações</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    variant="outline"
                    size="sm"
                    className="bg-green-50 hover:bg-green-100"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                  <Button onClick={resetToDefaults} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Resetar
                  </Button>
                </div>
              </div>

              <div className="space-y-2 p-4 border rounded-lg">
                <h4 className="font-medium">Configurações de Orçamento Salvas</h4>
                <div className="space-y-2">
                  <Select value={selectedConfigId} onValueChange={handleLoadConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma configuração..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.id.toString()}>
                          {config.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedConfigId && (
                    <Button
                      onClick={handleUpdateConfig}
                      variant="outline"
                      size="sm"
                      className="w-full bg-blue-50 hover:bg-blue-100"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Atualizar Configuração Atual
                    </Button>
                  )}

                  {selectedConfigId &&
                    savedConfigs.find((c) => c.id.toString() === selectedConfigId && c.nome !== "Padrão") && (
                      <Button
                        onClick={() => {
                          const config = savedConfigs.find((c) => c.id.toString() === selectedConfigId)
                          if (config) {
                            handleDeleteConfig(config.id, config.nome)
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deletar Configuração
                      </Button>
                    )}
                </div>
              </div>

              {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">Salvar Configuração de Orçamento</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="config-name">Nome da Configuração</Label>
                        <Input
                          id="config-name"
                          value={saveConfigName}
                          onChange={(e) => setSaveConfigName(e.target.value)}
                          placeholder="Ex: Layout Padrão Orçamento, Fonte Grande, etc."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => setShowSaveDialog(false)} variant="outline">
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveConfig} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Tamanhos de Fonte</h4>

                <div className="space-y-3">
                  <div>
                    <Label>Texto Principal: {layoutConfig.fontSize}px</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateLayoutConfig("fontSize", Math.max(8, layoutConfig.fontSize - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Slider
                        value={[layoutConfig.fontSize]}
                        onValueChange={([value]) => updateLayoutConfig("fontSize", value)}
                        min={8}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateLayoutConfig("fontSize", Math.min(20, layoutConfig.fontSize + 1))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Título: {layoutConfig.titleFontSize}px</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateLayoutConfig("titleFontSize", Math.max(12, layoutConfig.titleFontSize - 1))
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Slider
                        value={[layoutConfig.titleFontSize]}
                        onValueChange={([value]) => updateLayoutConfig("titleFontSize", value)}
                        min={12}
                        max={24}
                        step={1}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateLayoutConfig("titleFontSize", Math.min(24, layoutConfig.titleFontSize + 1))
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Cabeçalho: {layoutConfig.headerFontSize}px</Label>
                    <Slider
                      value={[layoutConfig.headerFontSize]}
                      onValueChange={([value]) => updateLayoutConfig("headerFontSize", value)}
                      min={6}
                      max={16}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Rodapé: {layoutConfig.footerFontSize}px</Label>
                    <Slider
                      value={[layoutConfig.footerFontSize]}
                      onValueChange={([value]) => updateLayoutConfig("footerFontSize", value)}
                      min={6}
                      max={16}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Títulos de Seção: {layoutConfig.sectionTitleFontSize}px</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateLayoutConfig(
                            "sectionTitleFontSize",
                            Math.max(10, layoutConfig.sectionTitleFontSize - 1),
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Slider
                        value={[layoutConfig.sectionTitleFontSize]}
                        onValueChange={([value]) => updateLayoutConfig("sectionTitleFontSize", value)}
                        min={10}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateLayoutConfig(
                            "sectionTitleFontSize",
                            Math.min(20, layoutConfig.sectionTitleFontSize + 1),
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Layout da Página</h4>

                <div>
                  <Label>Espaçamento entre linhas: {layoutConfig.lineHeight}</Label>
                  <Slider
                    value={[layoutConfig.lineHeight]}
                    onValueChange={([value]) => updateLayoutConfig("lineHeight", value)}
                    min={1.0}
                    max={2.5}
                    step={0.1}
                  />
                </div>

                <div>
                  <Label>Margem lateral: {layoutConfig.pageMargin}mm</Label>
                  <Slider
                    value={[layoutConfig.pageMargin]}
                    onValueChange={([value]) => updateLayoutConfig("pageMargin", value)}
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>

                <div>
                  <Label className="text-blue-600 font-medium">
                    🔝 Margem superior (Logo/Cabeçalho): {layoutConfig.marginTop}mm
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLayoutConfig("marginTop", Math.max(5, layoutConfig.marginTop - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[layoutConfig.marginTop]}
                      onValueChange={([value]) => updateLayoutConfig("marginTop", value)}
                      min={5}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLayoutConfig("marginTop", Math.min(30, layoutConfig.marginTop + 1))}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Menor valor = logo mais no topo</p>
                </div>

                <div>
                  <Label className="text-green-600 font-medium">
                    🔽 Margem inferior (Rodapé): {layoutConfig.marginBottom}mm
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLayoutConfig("marginBottom", Math.max(5, layoutConfig.marginBottom - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[layoutConfig.marginBottom]}
                      onValueChange={([value]) => updateLayoutConfig("marginBottom", value)}
                      min={5}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLayoutConfig("marginBottom", Math.min(30, layoutConfig.marginBottom + 1))}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Menor valor = rodapé mais embaixo</p>
                </div>

                <div>
                  <Label>Tamanho do logo: {layoutConfig.logoSize}px</Label>
                  <Slider
                    value={[layoutConfig.logoSize]}
                    onValueChange={([value]) => updateLayoutConfig("logoSize", value)}
                    min={20}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <Label className="text-purple-600 font-medium">
                    📄 Margem superior do conteúdo (após cabeçalho): {layoutConfig.contentMarginTop}mm
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateLayoutConfig("contentMarginTop", Math.max(0, layoutConfig.contentMarginTop - 1))
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[layoutConfig.contentMarginTop]}
                      onValueChange={([value]) => updateLayoutConfig("contentMarginTop", value)}
                      min={0}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateLayoutConfig("contentMarginTop", Math.min(20, layoutConfig.contentMarginTop + 1))
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Espaço entre cabeçalho e conteúdo</p>
                </div>

                <div>
                  <Label className="text-orange-600 font-medium">
                    📄 Margem inferior do conteúdo (antes do rodapé): {layoutConfig.contentMarginBottom}mm
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateLayoutConfig("contentMarginBottom", Math.max(0, layoutConfig.contentMarginBottom - 1))
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[layoutConfig.contentMarginBottom]}
                      onValueChange={([value]) => updateLayoutConfig("contentMarginBottom", value)}
                      min={0}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateLayoutConfig("contentMarginBottom", Math.min(20, layoutConfig.contentMarginBottom + 1))
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Espaço entre conteúdo e rodapé</p>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Elementos Visíveis</h4>

                <div className="flex items-center justify-between">
                  <Label>Mostrar Logo</Label>
                  <Switch
                    checked={layoutConfig.showLogo}
                    onCheckedChange={(checked) => updateLayoutConfig("showLogo", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Mostrar Cabeçalho</Label>
                  <Switch
                    checked={layoutConfig.showHeader}
                    onCheckedChange={(checked) => updateLayoutConfig("showHeader", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Mostrar Rodapé</Label>
                  <Switch
                    checked={layoutConfig.showFooter}
                    onCheckedChange={(checked) => updateLayoutConfig("showFooter", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Quebras de Página</h4>
                <p className="text-sm text-muted-foreground">
                  Digite os textos onde deseja quebrar a página (um por linha):
                </p>
                <Textarea
                  value={layoutConfig.customPageBreaks}
                  onChange={(e) => updateCustomPageBreaks(e.target.value)}
                  placeholder="Serviços a serem realizados&#10;Condições Gerais"
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="text-center text-sm font-medium text-blue-600">
                  📄 {paginasPreview.length}{" "}
                  {paginasPreview.length === 1 ? "página será gerada" : "páginas serão geradas"}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Preview</h3>
                  {paginasPreview.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaginaAtual(Math.max(0, paginaAtual - 1))}
                        disabled={paginaAtual === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Página {paginaAtual + 1} de {paginasPreview.length}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaginaAtual(Math.min(paginasPreview.length - 1, paginaAtual + 1))}
                        disabled={paginaAtual === paginasPreview.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleVisualizarCompleto}
                    variant="outline"
                    className="bg-green-50 hover:bg-green-100"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar Completo
                  </Button>
                  <Button onClick={handleImprimir} className="bg-blue-600 hover:bg-blue-700">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>

              <div
                className="border rounded-lg p-4 bg-white max-h-[70vh] overflow-y-auto"
                style={{
                  fontSize: `${layoutConfig.fontSize}px`,
                  lineHeight: layoutConfig.lineHeight,
                  paddingTop: `${layoutConfig.marginTop * 2}px`,
                  paddingBottom: `${layoutConfig.marginBottom * 2}px`,
                }}
              >
                <div className="space-y-4">
                  {layoutConfig.showLogo && (logoImpressao?.dados || timbradoConfig?.logo_url) && (
                    <div className="text-center border-b pb-4">
                      <img
                        src={logoImpressao?.dados || timbradoConfig?.logo_url || "/placeholder.svg"}
                        alt="Logo da Empresa"
                        className="mx-auto object-contain"
                        style={{ height: `${layoutConfig.logoSize}px` }}
                      />
                    </div>
                  )}

                  {layoutConfig.showHeader && timbradoConfig?.cabecalho && (
                    <div
                      className="text-center border-b pb-4"
                      style={{ fontSize: `${layoutConfig.headerFontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }}
                    />
                  )}

                  {paginaAtual === 0 &&
                    (() => {
                      const clienteInfo = getClienteInfoForDisplay()
                      // Declare observacoes here
                      const observacoes = (orcamento.observacoes || "").replace(/\n/g, "<br>")

                      return (
                        <>
                          <div className="text-center">
                            <h1 className="font-bold mb-2" style={{ fontSize: `${layoutConfig.titleFontSize}px` }}>
                              ORÇAMENTO {orcamento.numero}
                            </h1>
                          </div>

                          <div className="w-full h-0.5 bg-black my-4"></div>

                          <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                              <h3
                                className="font-bold underline mb-3"
                                style={{ fontSize: `${layoutConfig.sectionTitleFontSize}px` }}
                              >
                                Dados do Cliente
                              </h3>
                              <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                <strong>Nome:</strong> {orcamento.cliente_nome || ""}
                              </div>
                              {clienteInfo?.sindico && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>A/C Sr(a):</strong> {clienteInfo.sindico}
                                </div>
                              )}
                              <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                <strong>Data:</strong> {formatDate(orcamento.data_orcamento)}
                              </div>
                              <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                <strong>Validade:</strong> {calcularDataValidade()}
                              </div>
                              {orcamento.cliente_email && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>E-mail:</strong> {orcamento.cliente_email}
                                </div>
                              )}
                              {orcamento.cliente_cnpj && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>CNPJ:</strong> {orcamento.cliente_cnpj}
                                </div>
                              )}
                              {orcamento.cliente_cpf && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>CPF:</strong> {orcamento.cliente_cpf}
                                </div>
                              )}
                              {clienteInfo?.endereco && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>Endereço:</strong> {clienteInfo.endereco}
                                </div>
                              )}
                              {clienteInfo?.bairro && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>Bairro:</strong> {clienteInfo.bairro}
                                </div>
                              )}
                              {clienteInfo?.cidade && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>Cidade:</strong> {clienteInfo.cidade} - {clienteInfo.estado || ""}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h3
                                className="font-bold underline mb-3"
                                style={{ fontSize: `${layoutConfig.sectionTitleFontSize}px` }}
                              >
                                Dados do Orçamento
                              </h3>
                              <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                <strong>Tipo de Serviço:</strong> {orcamento.tipo_servico || ""}
                              </div>
                              {orcamento.prazo_dias && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>Prazo:</strong> {orcamento.prazo_dias} dias úteis
                                </div>
                              )}
                              {timbradoConfig?.empresa_representante_legal && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>Contato:</strong>{" "}
                                  {timbradoConfig.empresa_representante_legal.split(" ").length > 1
                                    ? timbradoConfig.empresa_representante_legal.split(" ")[0] +
                                      " " +
                                      timbradoConfig.empresa_representante_legal.split(" ").pop()
                                    : timbradoConfig.empresa_representante_legal}
                                </div>
                              )}
                              {timbradoConfig?.empresa_telefone && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>Telefone:</strong> {timbradoConfig.empresa_telefone}
                                </div>
                              )}
                              {timbradoConfig?.empresa_email && (
                                <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                  <strong>E-mail:</strong> {timbradoConfig.empresa_email}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Adiciona a variável de observações aqui, se existir e for necessário exibi-la */}
                          {orcamento.observacoes && (
                            <div className="mt-6">
                              <h3
                                className="font-bold underline mb-3"
                                style={{ fontSize: `${layoutConfig.sectionTitleFontSize}px` }}
                              >
                                Observações
                              </h3>
                              <div style={{ fontSize: `${layoutConfig.fontSize}px` }}>
                                <div dangerouslySetInnerHTML={{ __html: observacoes }} />
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}

                  {paginasPreview[paginaAtual] && (
                    <div className="text-justify" dangerouslySetInnerHTML={{ __html: paginasPreview[paginaAtual] }} />
                  )}

                  {layoutConfig.showFooter && timbradoConfig?.rodape && (
                    <div
                      className="text-center border-t pt-4 mt-8"
                      style={{ fontSize: `${layoutConfig.footerFontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }}
                    />
                  )}
                </div>
              </div>

              {paginasPreview.length > 1 && (
                <div className="mt-4 text-center">
                  <div className="flex justify-center gap-2">
                    {paginasPreview.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setPaginaAtual(index)}
                        className={`w-3 h-3 rounded-full ${index === paginaAtual ? "bg-blue-600" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Clique nos pontos para navegar entre as páginas</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-end space-x-2">
            <Button onClick={onClose} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
