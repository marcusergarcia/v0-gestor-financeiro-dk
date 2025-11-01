"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  X,
  Settings,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Printer,
  Eye,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ContratoPrintView } from "./contrato-print-view"

interface ContratoPrintEditorProps {
  contrato: any
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
}

interface SavedLayoutConfig {
  id: number
  nome: string
  tipo: "contrato" | "orcamento"
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
  custom_page_breaks: string
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

export function ContratoPrintEditor({ contrato, onClose }: ContratoPrintEditorProps) {
  const [timbradoConfig, setTimbradoConfig] = useState<TimbradoConfig | null>(null)
  const [logoImpressao, setLogoImpressao] = useState<LogoConfig | null>(null)
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
    pageBreaks: ["CLÁUSULA TERCEIRA", "OS EQUIPAMENTOS INCLUSOS:"],
    customPageBreaks: "CLÁUSULA TERCEIRA\nOS EQUIPAMENTOS INCLUSOS:",
  })

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

  const loadClienteCompleto = async () => {
    if (!contrato?.cliente_id) return

    try {
      const response = await fetch(`/api/clientes/${contrato.cliente_id}`)
      const result = await response.json()
      if (result.success) {
        setClienteCompleto(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error)
    }
  }

  useEffect(() => {
    fetchConfiguracoes()
    if (contrato?.cliente_id && !clienteCompleto) {
      loadClienteCompleto()
    }
  }, [])

  useEffect(() => {
    if (timbradoConfig && contrato) {
      processarConteudo()
    }
  }, [timbradoConfig, contrato])

  useEffect(() => {
    if (conteudoProcessado) {
      const paginas = dividirConteudoEmPaginas(conteudoProcessado)
      console.log("Páginas geradas:", paginas.length, paginas)
      setPaginasPreview(paginas)
      setPaginaAtual(0)
    }
  }, [conteudoProcessado, layoutConfig])

  const fetchConfiguracoes = async () => {
    try {
      const timbradoResponse = await fetch("/api/timbrado-config")
      const timbradoResult = await timbradoResponse.json()
      if (timbradoResult.success && timbradoResult.data) {
        setTimbradoConfig(timbradoResult.data)
      }

      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()
      if (logoResult.success && logoResult.data) {
        const logoImpressaoEncontrado = logoResult.data.find(
          (logo: LogoConfig) => logo.tipo === "impressao" && logo.ativo && logo.dados,
        )
        setLogoImpressao(logoImpressaoEncontrado || null)
      }

      // Filtrar apenas configurações do tipo "contrato"
      const layoutResponse = await fetch("/api/configuracoes/layout-impressao?tipo=contrato")
      if (layoutResponse.ok) {
        const layoutConfigs = await layoutResponse.json()
        setSavedConfigs(layoutConfigs)

        const defaultConfig = layoutConfigs.find((config: SavedLayoutConfig) => config.nome === "Padrão")
        if (defaultConfig) {
          loadSavedConfig(defaultConfig)
          setSelectedConfigId(defaultConfig.id.toString())
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedConfig = (config: SavedLayoutConfig) => {
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
      customPageBreaks: config.custom_page_breaks || "CLÁUSULA TERCEIRA\nOS EQUIPAMENTOS INCLUSOS",
      pageBreaks: (config.custom_page_breaks || "CLÁUSULA TERCEIRA\nOS EQUIPAMENTOS INCLUSOS")
        .split("\n")
        .filter((q) => q.trim()),
    })
  }

  const handleLoadConfig = (configId: string) => {
    const config = savedConfigs.find((c) => c.id.toString() === configId)
    if (config) {
      loadSavedConfig(config)
      setSelectedConfigId(configId)
      toast({
        title: "Configuração carregada",
        description: `Configuração "${config.nome}" aplicada com sucesso!`,
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
          tipo: "contrato",
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

  const handleSaveConfig = async () => {
    if (!saveConfigName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a configuração",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/configuracoes/layout-impressao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: saveConfigName,
          tipo: "contrato",
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
          showHeader: layoutConfig.showHeader,
          showFooter: layoutConfig.showFooter,
          logoSize: layoutConfig.logoSize,
          custom_page_breaks: layoutConfig.customPageBreaks,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: result.message,
        })
        setShowSaveDialog(false)
        setSaveConfigName("")

        const layoutResponse = await fetch("/api/configuracoes/layout-impressao?tipo=contrato")
        if (layoutResponse.ok) {
          const layoutConfigs = await layoutResponse.json()
          setSavedConfigs(layoutConfigs)
          setSelectedConfigId(result.data.id.toString())
        }
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao salvar configuração",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfig = async (configId: number, configName: string) => {
    if (configId === 1) {
      toast({
        title: "Erro",
        description: "Não é possível deletar a configuração padrão",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Tem certeza que deseja deletar a configuração "${configName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/configuracoes/layout-impressao/${configId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: result.message,
        })

        const layoutResponse = await fetch("/api/configuracoes/layout-impressao?tipo=contrato")
        if (layoutResponse.ok) {
          const layoutConfigs = await layoutResponse.json()
          setSavedConfigs(layoutConfigs)

          if (selectedConfigId === configId.toString()) {
            const defaultConfig = layoutConfigs.find((config: SavedLayoutConfig) => config.nome === "Padrão")
            if (defaultConfig) {
              loadSavedConfig(defaultConfig)
              setSelectedConfigId(defaultConfig.id.toString())
            }
          }
        }
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao deletar configuração",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao deletar configuração:", error)
      toast({
        title: "Erro",
        description: "Erro ao deletar configuração",
        variant: "destructive",
      })
    }
  }

  const processarConteudo = () => {
    if (!contrato.conteudo_contrato || !timbradoConfig) return

    let conteudo = contrato.conteudo_contrato

    conteudo = conteudo.replace(/\[EMPRESA_NOME\]/g, timbradoConfig.empresa_nome || "")
    conteudo = conteudo.replace(/\[EMPRESA_CNPJ\]/g, timbradoConfig.empresa_cnpj || "")
    conteudo = conteudo.replace(/\[EMPRESA_ENDERECO\]/g, timbradoConfig.empresa_endereco || "")
    conteudo = conteudo.replace(/\[EMPRESA_CEP\]/g, timbradoConfig.empresa_cep || "")
    conteudo = conteudo.replace(/\[EMPRESA_BAIRRO\]/g, timbradoConfig.empresa_bairro || "")
    conteudo = conteudo.replace(/\[EMPRESA_CIDADE\]/g, timbradoConfig.empresa_cidade || "")
    conteudo = conteudo.replace(/\[EMPRESA_UF\]/g, timbradoConfig.empresa_uf || "")
    conteudo = conteudo.replace(/\[EMPRESA_REPRESENTANTE_LEGAL\]/g, timbradoConfig.empresa_representante_legal || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_NACIONALIDADE\]/g, timbradoConfig.representante_nacionalidade || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_ESTADO_CIVIL\]/g, timbradoConfig.representante_estado_civil || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_RG\]/g, timbradoConfig.representante_rg || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_CPF\]/g, timbradoConfig.representante_cpf || "")

    conteudo = conteudo.replace(/\[NOME\]/g, contrato.cliente_nome || "")
    conteudo = conteudo.replace(/\[CNPJ\]/g, contrato.cliente_cnpj || contrato.cliente_cpf || "")
    conteudo = conteudo.replace(/\[ENDERECO\]/g, contrato.cliente_endereco || "")
    conteudo = conteudo.replace(/\[CEP\]/g, contrato.cliente_cep || "")
    conteudo = conteudo.replace(/\[BAIRRO\]/g, contrato.cliente_bairro || "")
    conteudo = conteudo.replace(/\[CIDADE\]/g, contrato.cliente_cidade || "")
    conteudo = conteudo.replace(/\[ESTADO\]/g, contrato.cliente_estado || "")
    conteudo = conteudo.replace(/\[SINDICO\]/g, contrato.cliente_sindico || "")
    conteudo = conteudo.replace(/\[RG_SINDICO\]/g, contrato.cliente_rg_sindico || "")
    conteudo = conteudo.replace(/\[CPF_SINDICO\]/g, contrato.cliente_cpf_sindico || "")

    conteudo = conteudo.replace(/\[PRAZO_CONTRATO\]/g, contrato.prazo_contrato?.toString() || "")
    conteudo = conteudo.replace(/\[DIA_VENCIMENTO\]/g, contrato.dia_vencimento?.toString() || "")
    conteudo = conteudo.replace(/\[DATA_INICIO\]/g, formatDate(contrato.data_inicio) || "")
    conteudo = conteudo.replace(/\[QUANTIDADE_VISITAS\]/g, contrato.quantidade_visitas?.toString() || "")

    const valorMensal = contrato.valor_mensal || 0
    const valorFormatado = formatCurrency(valorMensal)
    const valorExtenso = numeroParaExtenso(valorMensal)
    const valorCompleto = `${valorFormatado} (${valorExtenso})`
    conteudo = conteudo.replace(/\[VALOR_MENSAL\]/g, valorCompleto)

    let equipamentosTexto = ""
    if (contrato.equipamentos_inclusos && contrato.equipamentos_inclusos.length > 0) {
      const equipamentosFormatados = contrato.equipamentos_inclusos.map((eq: any) => {
        if (typeof eq === "object" && eq.nome) {
          const quantidade = eq.quantidade || 1
          return `${quantidade}x ${eq.nome}`
        }
        return `1x ${eq}`
      })
      equipamentosTexto = equipamentosFormatados.join("<br>")
    } else {
      equipamentosTexto = "Equipamentos conforme especificado na proposta"
    }

    if (contrato.equipamentos_consignacao && contrato.equipamentos_consignacao.trim()) {
      equipamentosTexto +=
        "<br><br><strong>EQUIPAMENTOS EM CONSIGNAÇÃO:</strong><br>" +
        contrato.equipamentos_consignacao.replace(/\n/g, "<br>")
    }

    conteudo = conteudo.replace(/\[EQUIPAMENTOS_INCLUSOS\]/g, equipamentosTexto)

    const localData = `<br><br>${timbradoConfig.empresa_cidade || "Local"}, ${dataParaExtenso(contrato.data_inicio)}<br><br>`
    conteudo += localData

    conteudo = conteudo.replace(/\n/g, "<br>")

    setConteudoProcessado(conteudo)
  }

  const numeroParaExtenso = (valor: number): string => {
    if (valor === 0) return "zero"

    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"]
    const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
    const especiais = [
      "dez",
      "onze",
      "doze",
      "treze",
      "quatorze",
      "quinze",
      "dezesseis",
      "dezessete",
      "dezoito",
      "dezenove",
    ]
    const centenas = [
      "",
      "cento",
      "duzentos",
      "trezentos",
      "quatrocentos",
      "quinhentos",
      "seiscentos",
      "setecentos",
      "oitocentos",
      "novecentos",
    ]

    const converterGrupo = (num: number): string => {
      if (num === 0) return ""
      if (num === 100) return "cem"

      let resultado = ""
      const c = Math.floor(num / 100)
      const d = Math.floor((num % 100) / 10)
      const u = num % 10

      if (c > 0) resultado += centenas[c]
      if (d === 1) {
        if (resultado) resultado += " e "
        resultado += especiais[u]
      } else {
        if (d > 0) {
          if (resultado) resultado += " e "
          resultado += dezenas[d]
        }
        if (u > 0) {
          if (resultado) resultado += " e "
          resultado += unidades[u]
        }
      }
      return resultado
    }

    let inteiro = Math.floor(valor)
    const centavos = Math.round((valor - inteiro) * 100)
    let resultado = ""

    if (inteiro >= 1000000) {
      const milhoes = Math.floor(inteiro / 1000000)
      resultado += converterGrupo(milhoes)
      resultado += milhoes === 1 ? " milhão" : " milhões"
      inteiro = inteiro % 1000000
      if (inteiro > 0) resultado += " e "
    }

    if (inteiro >= 1000) {
      const milhares = Math.floor(inteiro / 1000)
      if (resultado) resultado += " "
      resultado += converterGrupo(milhares) + " mil"
      inteiro = inteiro % 1000
      if (inteiro > 0) resultado += " e "
    }

    if (inteiro > 0) {
      if (resultado) resultado += " "
      resultado += converterGrupo(inteiro)
    }

    resultado += inteiro === 1 ? " real" : " reais"

    if (centavos > 0) {
      resultado += " e " + converterGrupo(centavos)
      resultado += centavos === 1 ? " centavo" : " centavos"
    }

    return resultado
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

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return ""
    const numeros = cnpj.replace(/\D/g, "")
    if (numeros.length === 14) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return cnpj
  }

  const formatCPF = (cpf: string) => {
    if (!cpf) return ""
    const numeros = cpf.replace(/\D/g, "")
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    return cpf
  }

  const formatRG = (rg: string) => {
    if (!rg) return ""
    const numeros = rg.replace(/\D/g, "")
    if (numeros.length >= 8) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4")
    }
    return rg
  }

  const dividirConteudoEmPaginas = (conteudo: string) => {
    if (!conteudo.trim()) return []

    const quebras = layoutConfig.customPageBreaks
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)

    console.log("Quebras configuradas:", quebras)

    if (quebras.length === 0) {
      return [conteudo]
    }

    const paginas: string[] = []
    let posicaoAtual = 0

    const primeiraQuebra = quebras[0]
    const posPrimeiraQuebra = conteudo.indexOf(primeiraQuebra)

    if (posPrimeiraQuebra !== -1) {
      paginas.push(conteudo.substring(0, posPrimeiraQuebra).trim())
      posicaoAtual = posPrimeiraQuebra
    } else {
      console.warn("Primeira quebra não encontrada:", primeiraQuebra)
      return [conteudo]
    }

    for (let i = 0; i < quebras.length - 1; i++) {
      const quebraAtual = quebras[i]
      const proximaQuebra = quebras[i + 1]

      const posQuebraAtual = conteudo.indexOf(quebraAtual, posicaoAtual)
      const posProximaQuebra = conteudo.indexOf(proximaQuebra, posQuebraAtual + quebraAtual.length)

      console.log(`Procurando quebra ${i + 1}:`, {
        quebraAtual,
        proximaQuebra,
        posQuebraAtual,
        posProximaQuebra,
      })

      if (posQuebraAtual !== -1 && posProximaQuebra !== -1) {
        const paginaConteudo = conteudo.substring(posQuebraAtual, posProximaQuebra).trim()
        paginas.push(paginaConteudo)
        posicaoAtual = posProximaQuebra
      } else if (posQuebraAtual !== -1) {
        const paginaConteudo = conteudo.substring(posQuebraAtual).trim()
        paginas.push(paginaConteudo)
        posicaoAtual = conteudo.length
        break
      }
    }

    const ultimaQuebra = quebras[quebras.length - 1]
    const posUltimaQuebra = conteudo.indexOf(ultimaQuebra, posicaoAtual)

    if (posUltimaQuebra !== -1 && posicaoAtual < conteudo.length) {
      const ultimaPagina = conteudo.substring(posUltimaQuebra).trim()
      if (ultimaPagina) {
        paginas.push(ultimaPagina)
      }
    }

    console.log("Total de páginas geradas:", paginas.length)
    return paginas.filter((p) => p.length > 0)
  }

  const handlePrintExact = () => {
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      const container = printWindow.document.createElement("div")
      printWindow.document.body.appendChild(container)

      const root = createRoot(container)
      root.render(
        <ContratoPrintView
          contrato={contrato}
          timbradoConfig={timbradoConfig}
          logoImpressao={logoImpressao}
          layoutConfig={layoutConfig}
          paginasConteudo={paginasPreview}
          clienteCompleto={clienteCompleto}
        />,
      )

      setTimeout(() => {
        printWindow.print()
      }, 1000)
    }
  }

  const handlePreviewExact = () => {
    const previewWindow = window.open("", "_blank")

    if (previewWindow) {
      const container = previewWindow.document.createElement("div")
      previewWindow.document.body.appendChild(container)

      const root = createRoot(container)
      root.render(
        <ContratoPrintView
          contrato={contrato}
          timbradoConfig={timbradoConfig}
          logoImpressao={logoImpressao}
          layoutConfig={layoutConfig}
          paginasConteudo={paginasPreview}
          clienteCompleto={clienteCompleto}
        />,
      )
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
      pageBreaks: ["CLÁUSULA TERCEIRA", "OS EQUIPAMENTOS INCLUSOS:"],
      customPageBreaks: "CLÁUSULA TERCEIRA\nOS EQUIPAMENTOS INCLUSOS:",
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

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const lineHeightCalc = layoutConfig.fontSize * layoutConfig.lineHeight
  const espacamentoAssinaturas = lineHeightCalc * 10

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
        {/* Bordas de redimensionamento */}
        <div
          className="absolute top-0 left-0 w-full h-2 cursor-n-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "n")}
          title="Redimensionar pelo topo"
        />
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "s")}
          title="Redimensionar pela base"
        />
        <div
          className="absolute top-0 left-0 w-2 h-full cursor-w-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "w")}
          title="Redimensionar pela esquerda"
        />
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-blue-400 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "e")}
          title="Redimensionar pela direita"
        />

        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
          title="Redimensionar pelo canto superior esquerdo"
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
          title="Redimensionar pelo canto superior direito"
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
          title="Redimensionar pelo canto inferior esquerdo"
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={(e) => handleResizeStart(e, "se")}
          title="Redimensionar pelo canto inferior direito"
        />

        <div className="h-full overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editor de Layout - Contrato {contrato.numero}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel de configurações (coluna esquerda) */}
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

              {/* Configurações salvas */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-medium">Configurações Salvas (Contratos)</h4>
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

                  {selectedConfigId && selectedConfigId !== "1" && (
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

              {/* Dialog de salvar */}
              {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">Salvar Configuração de Contrato</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="config-name">Nome da Configuração</Label>
                        <Input
                          id="config-name"
                          value={saveConfigName}
                          onChange={(e) => setSaveConfigName(e.target.value)}
                          placeholder="Ex: Layout Padrão Contratos, Fonte Grande, etc."
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

              {/* Tamanhos de fonte */}
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
                    <Label>Assinaturas: {layoutConfig.signatureFontSize}px</Label>
                    <Slider
                      value={[layoutConfig.signatureFontSize]}
                      onValueChange={([value]) => updateLayoutConfig("signatureFontSize", value)}
                      min={6}
                      max={16}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Layout da página */}
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
              </div>

              {/* Elementos visíveis */}
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

              {/* Quebras de página */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Quebras de Página</h4>
                <p className="text-sm text-muted-foreground">
                  Digite os textos onde deseja quebrar a página (um por linha):
                </p>
                <Textarea
                  value={layoutConfig.customPageBreaks}
                  onChange={(e) => updateCustomPageBreaks(e.target.value)}
                  placeholder="CLÁUSULA TERCEIRA&#10;OS EQUIPAMENTOS INCLUSOS:"
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="text-center text-sm font-medium text-blue-600">
                  📄 {paginasPreview.length}{" "}
                  {paginasPreview.length === 1 ? "página será gerada" : "páginas serão geradas"}
                </div>
              </div>
            </div>

            {/* Preview (coluna direita) */}
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
              </div>

              {/* Container do preview com scroll e fundo cinza */}
              <div className="bg-gray-100 rounded-lg p-4 overflow-auto" style={{ maxHeight: "75vh" }}>
                {/* Página A4 simulada com escala */}
                <div
                  className="mx-auto bg-white shadow-lg"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    transform: "scale(0.6)",
                    transformOrigin: "top center",
                    marginBottom: "-40%",
                  }}
                >
                  <div
                    className="p-0"
                    style={{
                      fontSize: `${layoutConfig.fontSize}px`,
                      lineHeight: layoutConfig.lineHeight,
                      paddingTop: `${layoutConfig.marginTop}mm`,
                      paddingBottom: `${layoutConfig.marginBottom}mm`,
                      paddingLeft: `${layoutConfig.pageMargin}mm`,
                      paddingRight: `${layoutConfig.pageMargin}mm`,
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

                      {paginaAtual === 0 && (
                        <div className="text-center">
                          <h1 className="font-bold mb-2" style={{ fontSize: `${layoutConfig.titleFontSize}px` }}>
                            CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DOS EQUIPAMENTOS ELETRÔNICOS
                          </h1>
                          <p style={{ fontSize: `${layoutConfig.fontSize + 2}px` }}>
                            Contrato Nº: <strong>{contrato.numero}</strong>
                          </p>
                        </div>
                      )}

                      {paginasPreview[paginaAtual] && (
                        <div
                          className="text-justify"
                          style={{
                            marginTop: `${layoutConfig.contentMarginTop}mm`,
                            marginBottom: `${layoutConfig.contentMarginBottom}mm`,
                          }}
                          dangerouslySetInnerHTML={{ __html: paginasPreview[paginaAtual] }}
                        />
                      )}

                      {paginaAtual === paginasPreview.length - 1 && paginasPreview.length > 1 && (
                        <>
                          <div
                            className="mt-8 grid grid-cols-2 gap-8 text-center"
                            style={{ marginBottom: `${espacamentoAssinaturas}px` }}
                          >
                            <div>
                              <div className="border-t-2 border-black pt-4 mt-8">
                                <p className="font-bold" style={{ fontSize: `${layoutConfig.signatureFontSize}px` }}>
                                  {timbradoConfig?.empresa_nome || "EMPRESA"}
                                </p>
                                <p style={{ fontSize: `${layoutConfig.signatureFontSize - 1}px` }}>
                                  CNPJ: {formatCNPJ(timbradoConfig?.empresa_cnpj || "")}
                                </p>
                              </div>
                            </div>
                            <div>
                              <div className="border-t-2 border-black pt-4 mt-8">
                                <p className="font-bold" style={{ fontSize: `${layoutConfig.signatureFontSize}px` }}>
                                  {contrato.cliente_nome || clienteCompleto?.nome}
                                </p>
                                <p style={{ fontSize: `${layoutConfig.signatureFontSize - 1}px` }}>
                                  CNPJ:{" "}
                                  {formatCNPJ(
                                    contrato.cliente_cnpj ||
                                      contrato.cliente_cpf ||
                                      clienteCompleto?.cnpj ||
                                      clienteCompleto?.cpf ||
                                      "",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
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

          {/* Botões de ação */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex gap-2">
              <Button onClick={handlePreviewExact} variant="outline" className="bg-green-50 hover:bg-green-100">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Completo
              </Button>
              <Button onClick={handlePrintExact} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
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
