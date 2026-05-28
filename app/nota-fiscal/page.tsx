"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ResizableTable } from "@/components/ui/resizable-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Plus,
  Search,
  Eye,
  EyeOff,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileCheck,
  DollarSign,
  Send,
  RefreshCw,
  Printer,
  Receipt,
  Package,
  Wrench,
  Download,
  Calendar,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { DetalheNfseDialog } from "@/components/nfse/detalhe-nfse-dialog"
import { ImprimirNfseDialog } from "@/components/nfse/imprimir-nfse-dialog"
import { NovoBoletoDialog } from "@/components/financeiro/novo-boleto-dialog"
import { VisualizarBoletosDialog } from "@/components/financeiro/visualizar-boletos-dialog"
import { EmitirNfeDialog } from "@/components/nfe/emitir-nfe-dialog"
import { DetalheNfeDialog } from "@/components/nfe/detalhe-nfe-dialog"
import { DanfeDialog } from "@/components/nfe/danfe-dialog"
import Link from "next/link"

// Tipo unificado para ambas as notas
interface NotaUnificada {
  id: number
  tipo: "nfse" | "nfe" // Tipo da nota
  // Campos comuns
  numero: string | null // numero_nfse ou numero_nfe
  origem: string
  origem_id: number | null
  origem_numero: string | null
  cliente_id: number | null
  cliente_nome: string | null
  tomador_razao_social: string
  tomador_cpf_cnpj: string
  valor_total: number
  status: string
  data_emissao: string | null
  created_at: string
  mensagem_erro: string | null
  // Campos NFS-e
  numero_nfse?: string | null
  numero_rps?: number
  serie_rps?: string
  codigo_verificacao?: string | null
  valor_servicos?: number
  descricao_servico?: string | null
  // Campos NF-e
  numero_nfe?: number
  serie?: number
  chave_acesso?: string
  protocolo?: string
  valor_produtos?: number
  natureza_operacao?: string
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

export default function NotaFiscalPage() {
  const [notas, setNotas] = useState<NotaUnificada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [origemFilter, setOrigemFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [periodoFilter, setPeriodoFilter] = useState("todos")
  const [exportando, setExportando] = useState(false)
  const [showValues, setShowValues] = useState(true)

  // NFS-e states
  const [emitirNfseOpen, setEmitirNfseOpen] = useState(false)
  const [detalheNfseOpen, setDetalheNfseOpen] = useState(false)
  const [nfseSelecionada, setNfseSelecionada] = useState<number | null>(null)
  const [imprimirNfseOpen, setImprimirNfseOpen] = useState(false)
  const [notaImprimirNfse, setNotaImprimirNfse] = useState<number | null>(null)

  // NF-e states
  const [emitirNfeOpen, setEmitirNfeOpen] = useState(false)
  const [detalheNfeOpen, setDetalheNfeOpen] = useState(false)
  const [nfeSelecionada, setNfeSelecionada] = useState<number | null>(null)
  const [danfeOpen, setDanfeOpen] = useState(false)
  const [danfeNfeId, setDanfeNfeId] = useState<number | null>(null)

  // Cancelamento
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [notaCancelar, setNotaCancelar] = useState<NotaUnificada | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")
  const [cancelando, setCancelando] = useState(false)

  const [consultandoId, setConsultandoId] = useState<number | null>(null)
  const [logoMenu, setLogoMenu] = useState<string>("")

  // Boleto
  const [boletoOpen, setBoletoOpen] = useState(false)
  const [notaParaBoleto, setNotaParaBoleto] = useState<any>(null)
  const [visualizarBoletosOpen, setVisualizarBoletosOpen] = useState(false)
  const [visualizarBoletosNumero, setVisualizarBoletosNumero] = useState("")
  const [boletoStatusMap, setBoletoStatusMap] = useState<Record<string, { temBoleto: boolean; aguardandoPagamento: boolean }>>({})

  const { toast } = useToast()

  const [stats, setStats] = useState({
    total: 0,
    emitidas: 0,
    pendentes: 0,
    canceladas: 0,
    erros: 0,
    valorTotal: 0,
    totalNfse: 0,
    totalNfe: 0,
  })

  useEffect(() => {
    const savedShowValues = localStorage.getItem("notas-show-values")
    if (savedShowValues !== null) {
      setShowValues(savedShowValues === "true")
    }
    fetchTodasNotas()
    loadLogoMenu()
  }, [])

  useEffect(() => {
    calcularStats()
  }, [notas])

  const toggleShowValues = () => {
    const newValue = !showValues
    setShowValues(newValue)
    localStorage.setItem("notas-show-values", String(newValue))
  }

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.caminho) {
          setLogoMenu(menuLogo.caminho)
        } else if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error)
    }
  }

  const fetchTodasNotas = async () => {
    try {
      // Fetch NFS-e and NF-e em paralelo
      const [nfseResponse, nfeResponse] = await Promise.all([
        fetch("/api/nfse").catch(() => null),
        fetch("/api/nfe").catch(() => null),
      ])

      const notasUnificadas: NotaUnificada[] = []

      // Processar NFS-e
      if (nfseResponse?.ok) {
        const nfseResult = await nfseResponse.json()
        if (nfseResult.success && nfseResult.data) {
          for (const n of nfseResult.data) {
            notasUnificadas.push({
              id: n.id,
              tipo: "nfse",
              numero: n.numero_nfse || null,
              numero_nfse: n.numero_nfse,
              numero_rps: n.numero_rps,
              serie_rps: n.serie_rps,
              codigo_verificacao: n.codigo_verificacao,
              origem: n.origem || "avulsa",
              origem_id: n.origem_id,
              origem_numero: n.origem_numero,
              cliente_id: n.cliente_id,
              cliente_nome: n.cliente_nome,
              tomador_razao_social: n.tomador_razao_social || n.cliente_nome || "",
              tomador_cpf_cnpj: n.tomador_cpf_cnpj || "",
              valor_servicos: n.valor_servicos,
              valor_total: Number(n.valor_total) || 0,
              descricao_servico: n.descricao_servico,
              status: n.status,
              data_emissao: n.data_emissao,
              created_at: n.created_at,
              mensagem_erro: n.mensagem_erro,
            })
          }
          // Fetch boleto status for NFS-e
          fetchBoletoStatus(nfseResult.data)
        }
      }

      // Processar NF-e
      if (nfeResponse?.ok) {
        const nfeResult = await nfeResponse.json()
        if (nfeResult.success && nfeResult.data) {
          for (const n of nfeResult.data) {
            notasUnificadas.push({
              id: n.id,
              tipo: "nfe",
              numero: n.numero_nfe ? String(n.numero_nfe) : null,
              numero_nfe: n.numero_nfe,
              serie: n.serie,
              chave_acesso: n.chave_acesso,
              protocolo: n.protocolo,
              origem: n.origem || "avulsa",
              origem_id: n.origem_id,
              origem_numero: n.origem_numero,
              cliente_id: n.cliente_id,
              cliente_nome: n.cliente_nome,
              tomador_razao_social: n.dest_razao_social || n.cliente_nome || "",
              tomador_cpf_cnpj: n.dest_cpf_cnpj || "",
              valor_produtos: n.valor_produtos,
              valor_total: Number(n.valor_total) || Number(n.valor_produtos) || 0,
              natureza_operacao: n.natureza_operacao,
              status: n.status,
              data_emissao: n.data_emissao || n.data_autorizacao,
              created_at: n.created_at,
              mensagem_erro: n.mensagem_erro,
            })
          }
        }
      }

      // Ordenar por data de criacao (mais recente primeiro)
      notasUnificadas.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })

      setNotas(notasUnificadas)
      // Fetch boleto status para todas as notas emitidas/autorizadas
      fetchBoletoStatusAll(notasUnificadas)
    } catch {
      setNotas([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBoletoStatus = async (notasList: any[]) => {
    try {
      const emitidas = notasList.filter((n: any) => n.status === "emitida" && n.numero_nfse)
      if (emitidas.length === 0) return

      const response = await fetch("/api/boletos/status-por-nota")
      const result = await response.json()
      if (result.success && result.data) {
        setBoletoStatusMap(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar status dos boletos:", error)
    }
  }

  const fetchBoletoStatusAll = async (notasUnificadas: NotaUnificada[]) => {
    try {
      const temNotasEmitidas = notasUnificadas.some(
        (n) => (n.status === "emitida" || n.status === "autorizada") && (n.numero_nfse || n.numero_nfe)
      )
      if (!temNotasEmitidas) return

      const response = await fetch("/api/boletos/status-por-nota")
      const result = await response.json()
      if (result.success && result.data) {
        setBoletoStatusMap(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar status dos boletos:", error)
    }
  }

  const calcularStats = () => {
    const statusEmitida = notas.filter((n) => n.status === "emitida" || n.status === "autorizada")
    setStats({
      total: notas.length,
      emitidas: statusEmitida.length,
      pendentes: notas.filter((n) => n.status === "pendente" || n.status === "processando").length,
      canceladas: notas.filter((n) => n.status === "cancelada").length,
      erros: notas.filter((n) => n.status === "erro" || n.status === "rejeitada").length,
      valorTotal: statusEmitida.reduce((sum, n) => sum + Number(n.valor_total), 0),
      totalNfse: notas.filter((n) => n.tipo === "nfse").length,
      totalNfe: notas.filter((n) => n.tipo === "nfe").length,
    })
  }

  const handleConsultarNfse = async (notaId: number) => {
    setConsultandoId(notaId)
    try {
      const response = await fetch(`/api/nfse/${notaId}/consultar`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "NFS-e Encontrada!", description: result.message })
        fetchTodasNotas()
      } else {
        toast({
          title: "Consulta NFS-e",
          description: result.message,
          variant: result.data?.status === "processando" ? "default" : "destructive",
        })
        if (result.data?.status === "erro") fetchTodasNotas()
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao consultar status da NFS-e", variant: "destructive" })
    } finally {
      setConsultandoId(null)
    }
  }

  const handleConsultarNfe = async (notaId: number) => {
    setConsultandoId(notaId)
    try {
      const response = await fetch(`/api/nfe/${notaId}/consultar`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "NF-e Consultada!", description: `cStat: ${result.data?.cStat} - ${result.data?.xMotivo}` })
        fetchTodasNotas()
      } else {
        toast({ title: "Consulta NF-e", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao consultar NF-e na SEFAZ", variant: "destructive" })
    } finally {
      setConsultandoId(null)
    }
  }

  const handleConsultarTodas = async () => {
    const processando = notas.filter((n) => n.status === "processando")
    if (processando.length === 0) {
      toast({ title: "Nenhuma nota pendente", description: "Nao ha notas em processamento para consultar." })
      return
    }

    toast({ title: "Consultando...", description: `Consultando ${processando.length} nota(s)...` })

    for (const nota of processando) {
      if (nota.tipo === "nfse") {
        await handleConsultarNfse(nota.id)
      } else {
        await handleConsultarNfe(nota.id)
      }
      await new Promise((r) => setTimeout(r, 1000))
    }

    fetchTodasNotas()
  }

  const handleCancelar = async () => {
    if (!notaCancelar) return
    setCancelando(true)
    try {
      if (notaCancelar.tipo === "nfse") {
        const response = await fetch(`/api/nfse/${notaCancelar.id}/cancelar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo: motivoCancelamento }),
        })
        const result = await response.json()
        if (result.success) {
          toast({ title: "NFS-e cancelada", description: "Nota fiscal de servico cancelada com sucesso" })
          fetchTodasNotas()
        } else {
          toast({ title: "Erro", description: result.message, variant: "destructive" })
        }
      } else {
        toast({ title: "Info", description: "Cancelamento de NF-e sera implementado em breve." })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao cancelar nota fiscal", variant: "destructive" })
    } finally {
      setCancelando(false)
      setCancelarOpen(false)
      setNotaCancelar(null)
      setMotivoCancelamento("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "emitida":
      case "autorizada":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 gap-1 font-semibold py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            {status === "autorizada" ? "Autorizada" : "Emitida"}
          </Badge>
        )
      case "processando":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-semibold py-0.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
          </Badge>
        )
      case "pendente":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-semibold py-0.5">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 gap-1 font-semibold py-0.5">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        )
      case "erro":
      case "rejeitada":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 gap-1 font-semibold py-0.5">
            <AlertCircle className="h-3 w-3" />
            {status === "rejeitada" ? "Rejeitada" : "Erro"}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: "nfse" | "nfe") => {
    if (tipo === "nfse") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[10px] font-bold">
          <Wrench className="h-3 w-3" />
          NFS-e
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[10px] font-bold">
        <Package className="h-3 w-3" />
        NF-e
      </Badge>
    )
  }

  const getOrigemLabel = (origem: string) => {
    switch (origem) {
      case "orcamento": return "Orçamento"
      case "ordem_servico": return "O.S."
      case "boleto": return "Boleto"
      case "avulsa": return "Avulsa"
      default: return origem
    }
  }

  // Funcao para verificar se uma data esta no periodo selecionado
  const isNoPeriodo = (dataStr: string | null, periodo: string): boolean => {
    if (!dataStr || periodo === "todos") return true
    
    const data = new Date(dataStr)
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    
    if (periodo === "mes_atual") {
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual
    }
    
    if (periodo === "mes_anterior") {
      const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1
      const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual
      return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior
    }
    
    return true
  }

  // Funcao para exportar as notas filtradas
  const handleExportar = async (formato: "csv" | "xml") => {
    setExportando(true)
    try {
      const notasParaExportar = notasFiltradas
      
      if (notasParaExportar.length === 0) {
        toast({ 
          title: "Nenhuma nota para exportar", 
          description: "Aplique os filtros para selecionar as notas que deseja exportar.",
          variant: "destructive" 
        })
        setExportando(false)
        return
      }

      if (formato === "csv") {
        // Gerar CSV
        const headers = [
          "Tipo",
          "Numero",
          "Serie",
          "RPS",
          "Chave Acesso",
          "Codigo Verificacao",
          "Cliente Nome",
          "Cliente CNPJ/CPF",
          "Origem",
          "Origem Numero",
          "Valor Total",
          "Valor Servicos",
          "Valor Produtos",
          "Status",
          "Data Emissao",
          "Data Criacao",
          "Descricao Servico",
          "Natureza Operacao",
          "Protocolo"
        ]
        
        const rows = notasParaExportar.map(nota => [
          nota.tipo.toUpperCase(),
          nota.numero || "",
          nota.tipo === "nfe" ? (nota.serie || "") : (nota.serie_rps || ""),
          nota.tipo === "nfse" ? (nota.numero_rps || "") : "",
          nota.chave_acesso || "",
          nota.codigo_verificacao || "",
          (nota.tomador_razao_social || nota.cliente_nome || "").replace(/"/g, '""'),
          nota.tomador_cpf_cnpj || "",
          nota.origem || "",
          nota.origem_numero || "",
          Number(nota.valor_total || 0).toFixed(2),
          Number(nota.valor_servicos || 0).toFixed(2),
          Number(nota.valor_produtos || 0).toFixed(2),
          nota.status || "",
          nota.data_emissao ? formatDateBR(nota.data_emissao) : "",
          nota.created_at ? formatDateBR(nota.created_at) : "",
          (nota.descricao_servico || "").replace(/"/g, '""').replace(/\n/g, ' '),
          (nota.natureza_operacao || "").replace(/"/g, '""'),
          nota.protocolo || ""
        ])
        
        const csvContent = [
          headers.join(";"),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
        ].join("\n")
        
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `notas_fiscais_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
        
        toast({ title: "Exportado com sucesso!", description: `${notasParaExportar.length} notas exportadas em CSV.` })
      } else {
        // Exportar XMLs no formato padrao SEFAZ (NF-e) 
        // Filtrar apenas NF-e autorizadas (NFS-e usa formato diferente)
        const nfesAutorizadas = notasParaExportar.filter(n => n.tipo === "nfe" && n.status === "autorizada")
        const nfsesAutorizadas = notasParaExportar.filter(n => n.tipo === "nfse" && (n.status === "emitida" || n.status === "autorizada"))
        
        if (nfesAutorizadas.length === 0 && nfsesAutorizadas.length === 0) {
          toast({ 
            title: "Nenhuma nota autorizada", 
            description: "Selecione notas com status 'Autorizada' ou 'Emitida' para exportar o XML.",
            variant: "destructive" 
          })
          setExportando(false)
          return
        }

        // Buscar XMLs das NF-e autorizadas via API
        let xmlsExportados = 0
        
        if (nfesAutorizadas.length > 0) {
          const nfeIds = nfesAutorizadas.map(n => n.id)
          const response = await fetch("/api/nfe/exportar-xml", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nfeIds })
          })
          
          const result = await response.json()
          
          if (result.success && result.data?.length > 0) {
            // Ordenar por numero da nota em ordem crescente
            const nfesOrdenadas = result.data.sort((a: any, b: any) => {
              const numA = parseInt(a.numero) || 0
              const numB = parseInt(b.numero) || 0
              return numA - numB
            })
            
            // PADRAO SEFAZ: Cada NF-e deve ser um arquivo XML individual
            // Formato: NFe + chave de acesso (44 digitos) + .xml
            
            if (nfesOrdenadas.length === 1) {
              // Apenas uma nota: baixar diretamente o XML individual
              const nfe = nfesOrdenadas[0]
              if (nfe.xml) {
                const blob = new Blob([nfe.xml], { type: "application/xml;charset=utf-8" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = nfe.nomeArquivo || `NFe${nfe.chaveAcesso}.xml`
                link.click()
                URL.revokeObjectURL(url)
                xmlsExportados = 1
              }
            } else {
              // Multiplas notas: criar um ZIP com arquivos individuais
              const JSZip = (await import("jszip")).default
              const zip = new JSZip()
              
              for (const nfe of nfesOrdenadas) {
                if (nfe.xml) {
                  const nomeArquivo = nfe.nomeArquivo || `NFe${nfe.chaveAcesso}.xml`
                  zip.file(nomeArquivo, nfe.xml)
                  xmlsExportados++
                }
              }
              
              const zipContent = await zip.generateAsync({ type: "blob" })
              const url = URL.createObjectURL(zipContent)
              const link = document.createElement("a")
              link.href = url
              const dataAtual = new Date().toISOString().split('T')[0]
              link.download = `NFe_${dataAtual}_${xmlsExportados}notas.zip`
              link.click()
              URL.revokeObjectURL(url)
            }
          }
        }
        
        // Para NFS-e, manter o formato simplificado (XML proprio da prefeitura nao e armazenado completo)
        if (nfsesAutorizadas.length > 0) {
          let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n'
          xmlContent += '<NotasFiscaisServico>\n'
          xmlContent += `  <DataExportacao>${new Date().toISOString()}</DataExportacao>\n`
          xmlContent += `  <TotalNotas>${nfsesAutorizadas.length}</TotalNotas>\n`
          xmlContent += '  <Notas>\n'
          
          for (const nota of nfsesAutorizadas) {
            xmlContent += '    <NFS-e>\n'
            xmlContent += `      <Numero>${nota.numero || nota.numero_nfse || ""}</Numero>\n`
            xmlContent += `      <NumeroRPS>${nota.numero_rps || ""}</NumeroRPS>\n`
            xmlContent += `      <SerieRPS>${nota.serie_rps || ""}</SerieRPS>\n`
            xmlContent += `      <CodigoVerificacao>${nota.codigo_verificacao || ""}</CodigoVerificacao>\n`
            xmlContent += `      <Tomador><![CDATA[${nota.tomador_razao_social || nota.cliente_nome || ""}]]></Tomador>\n`
            xmlContent += `      <CpfCnpjTomador>${nota.tomador_cpf_cnpj || ""}</CpfCnpjTomador>\n`
            xmlContent += `      <ValorServicos>${Number(nota.valor_servicos || nota.valor_total || 0).toFixed(2)}</ValorServicos>\n`
            xmlContent += `      <DataEmissao>${nota.data_emissao || ""}</DataEmissao>\n`
            xmlContent += `      <DescricaoServico><![CDATA[${nota.descricao_servico || ""}]]></DescricaoServico>\n`
            xmlContent += '    </NFS-e>\n'
          }
          
          xmlContent += '  </Notas>\n'
          xmlContent += '</NotasFiscaisServico>'
          
          const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `NFSe_${new Date().toISOString().split('T')[0]}.xml`
          link.click()
          URL.revokeObjectURL(url)
          xmlsExportados += nfsesAutorizadas.length
        }
        
        if (xmlsExportados > 0) {
          toast({ title: "Exportado com sucesso!", description: `${xmlsExportados} XML(s) exportado(s) no formato padrao.` })
        } else {
          toast({ 
            title: "Nenhum XML encontrado", 
            description: "Os XMLs autorizados nao foram encontrados no banco de dados.",
            variant: "destructive" 
          })
        }
      }
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({ title: "Erro ao exportar", description: "Ocorreu um erro ao gerar o arquivo de exportacao.", variant: "destructive" })
    } finally {
      setExportando(false)
    }
  }

  const notasFiltradas = notas.filter((nota) => {
    // Filtro de tipo
    if (tipoFilter !== "todos" && nota.tipo !== tipoFilter) return false
    // Filtro de status
    if (statusFilter !== "todos") {
      if (statusFilter === "emitida" && nota.status !== "emitida" && nota.status !== "autorizada") return false
      if (statusFilter === "erro" && nota.status !== "erro" && nota.status !== "rejeitada") return false
      if (statusFilter !== "emitida" && statusFilter !== "erro" && nota.status !== statusFilter) return false
    }
    // Filtro de origem
    if (origemFilter !== "todos" && nota.origem !== origemFilter) return false
    // Filtro de periodo
    if (!isNoPeriodo(nota.data_emissao || nota.created_at, periodoFilter)) return false
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchSearch =
        nota.numero?.toLowerCase().includes(search) ||
        nota.numero_nfse?.toLowerCase().includes(search) ||
        String(nota.numero_nfe || "").includes(search) ||
        nota.tomador_razao_social?.toLowerCase().includes(search) ||
        nota.cliente_nome?.toLowerCase().includes(search) ||
        String(nota.numero_rps || "").includes(search) ||
        nota.tomador_cpf_cnpj?.includes(search) ||
        nota.chave_acesso?.includes(search)
      if (!matchSearch) return false
    }
    return true
  })

  const handleVerDetalhes = (nota: NotaUnificada) => {
    if (nota.tipo === "nfse") {
      setNfseSelecionada(nota.id)
      setDetalheNfseOpen(true)
    } else {
      setNfeSelecionada(nota.id)
      setDetalheNfeOpen(true)
    }
  }

  const handleImprimir = (nota: NotaUnificada) => {
    if (nota.tipo === "nfse") {
      setNotaImprimirNfse(nota.id)
      setImprimirNfseOpen(true)
    } else {
      setDanfeNfeId(nota.id)
      setDanfeOpen(true)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen animate-in fade-in duration-300">
      <div className="container mx-auto space-y-6 pb-32 md:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-6 w-6 md:h-8 md:w-8 object-contain rounded"
              />
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Notas Fiscais
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Gerenciamento de NFS-e (Serviço) e NF-e (Material)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleShowValues}
              className="flex items-center justify-center gap-2 h-9 rounded-lg border-2 bg-transparent hover:bg-slate-50"
            >
              {showValues ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="text-xs font-semibold">Ocultar Valores</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-semibold">Mostrar Valores</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => setEmitirNfseOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-lg px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Emitir NFS-e</span>
            </Button>
            <Button
              onClick={() => setEmitirNfeOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-lg px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Emitir NF-e</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Card Total */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-slate-900/60 dark:to-blue-950/30 border-2 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:scale-105 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Total</p>
                <h3 className="text-xl md:text-2xl font-black text-blue-950 mt-1">{stats.total}</h3>
              </div>
              <FileText className="h-8 w-8 text-blue-600/30 shrink-0" />
            </CardContent>
          </Card>

          {/* Card NFS-e */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-slate-900/60 dark:to-emerald-950/30 border-2 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:scale-105 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">NFS-e</p>
                <h3 className="text-xl md:text-2xl font-black text-emerald-950 mt-1">{stats.totalNfse}</h3>
              </div>
              <Wrench className="h-8 w-8 text-emerald-600/30 shrink-0" />
            </CardContent>
          </Card>

          {/* Card NF-e */}
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:from-slate-900/60 dark:to-cyan-950/30 border-2 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:scale-105 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">NF-e</p>
                <h3 className="text-xl md:text-2xl font-black text-cyan-955 mt-1">{stats.totalNfe}</h3>
              </div>
              <Package className="h-8 w-8 text-cyan-600/30 shrink-0" />
            </CardContent>
          </Card>

          {/* Card Emitidas */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-slate-900/60 dark:to-green-950/30 border-2 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:scale-105 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Emitidas</p>
                <h3 className="text-xl md:text-2xl font-black text-green-950 mt-1">{stats.emitidas}</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600/30 shrink-0" />
            </CardContent>
          </Card>

          {/* Card Erros */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-slate-900/60 dark:to-red-950/30 border-2 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:scale-105 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Erros</p>
                <h3 className="text-xl md:text-2xl font-black text-red-955 mt-1">{stats.erros}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600/30 shrink-0" />
            </CardContent>
          </Card>

          {/* Card Valor Total */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-slate-900/60 dark:to-amber-950/30 border-2 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:scale-105 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Valor Total</p>
                <h3 className="text-sm md:text-base lg:text-lg font-black text-amber-950 mt-1 truncate">
                  {showValues ? formatCurrency(stats.valorTotal) : "R$ ****"}
                </h3>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600/30 shrink-0" />
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Tabela */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 lg:p-6 rounded-t-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base md:text-lg text-white flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Notas Fiscais Emitidas
                </CardTitle>
                <CardDescription className="text-emerald-100 text-xs md:text-sm">Consulte, imprima e gerencie suas notas fiscais de serviço e material</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {stats.pendentes > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConsultarTodas}
                    disabled={consultandoId !== null}
                    className="text-white border-white/30 bg-white/10 hover:bg-white/20"
                  >
                    {consultandoId !== null ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Consultar Pendentes ({stats.pendentes})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchTodasNotas() }} className="text-white border-white/30 bg-white/10 hover:bg-white/20">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por numero, nome, CNPJ, chave de acesso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-2 rounded-lg"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-36 h-10 border-2 rounded-lg">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="nfse">NFS-e</SelectItem>
                  <SelectItem value="nfe">NF-e</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 h-10 border-2 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="emitida">Emitida/Autorizada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="erro">Erro/Rejeitada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={origemFilter} onValueChange={setOrigemFilter}>
                <SelectTrigger className="w-full md:w-40 h-10 border-2 rounded-lg">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Origens</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="ordem_servico">O.S.</SelectItem>
                  <SelectItem value="avulsa">Avulsa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                <SelectTrigger className="w-full md:w-44 h-10 border-2 rounded-lg">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Barra de exportacao */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 p-3 bg-slate-50/80 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span>
                  <strong>{notasFiltradas.length}</strong> nota(s) encontrada(s)
                  {tipoFilter !== "todos" && ` | Tipo: ${tipoFilter.toUpperCase()}`}
                  {periodoFilter !== "todos" && ` | Periodo: ${periodoFilter === "mes_atual" ? "Mês Atual" : "Mês Anterior"}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Exportar para:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportar("csv")}
                  disabled={exportando || notasFiltradas.length === 0}
                  className="text-emerald-600 border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 h-8 font-semibold text-xs rounded-lg"
                >
                  {exportando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportar("xml")}
                  disabled={exportando || notasFiltradas.length === 0}
                  className="text-blue-600 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 h-8 font-semibold text-xs rounded-lg"
                >
                  {exportando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  XML
                </Button>
              </div>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : notasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Nenhuma nota fiscal encontrada</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                  Emita notas a partir de orçamentos aprovados ou clique nos botões abaixo para gerar uma nota avulsa.
                </p>
                <div className="flex items-center gap-2 justify-center mt-6">
                  <Button
                    onClick={() => setEmitirNfseOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Emitir NFS-e
                  </Button>
                  <Button
                    onClick={() => setEmitirNfeOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Emitir NF-e
                  </Button>
                </div>
              </div>
            ) : (
              <ResizableTable<NotaUnificada>
                    storageKey="notas-fiscais"
                    columns={[
                      { key: "tipo",        label: "Tipo",   width: 70,  sortable: true },
                      { key: "numero",      label: "Número", width: 130, sortable: true },
                      { key: "cliente",     label: "Cliente", width: 200, sortable: true },
                      { key: "origem",      label: "Origem",  width: 120, sortable: true },
                      { key: "valor_total", label: "Valor",   width: 110, sortable: true, align: "right" },
                      { key: "status",      label: "Status",  width: 120, sortable: true },
                      { key: "data",        label: "Data",    width: 90,  sortable: true },
                      { key: "acoes",       label: "Ações",   width: 160, sortable: false, noResize: true, align: "right" },
                    ]}
                    data={notasFiltradas}
                    rowKey={(row) => `${row.tipo}-${row.id}`}
                    renderCell={(nota, col) => {
                      switch (col) {
                        case "tipo": return getTipoBadge(nota.tipo)
                        case "numero":
                          return (
                            <div>
                              {nota.tipo === "nfse" ? (
                                <>
                                  {nota.numero_nfse ? (
                                    <span className="font-bold text-emerald-700">{String(nota.numero_nfse).padStart(8, "0")}</span>
                                  ) : (nota.status === "processando" || nota.status === "erro") ? (
                                    <button className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
                                      onClick={() => handleConsultarNfse(nota.id)} disabled={consultandoId === nota.id}>
                                      {consultandoId === nota.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                      Consultar
                                    </button>
                                  ) : <span className="text-gray-400 text-xs italic">-</span>}
                                  <p className="text-[10px] text-gray-400 font-medium">RPS: {nota.serie_rps || "11"}.{String(nota.numero_rps || 0).padStart(8, "0")}</p>
                                </>
                              ) : (
                                <>
                                  {nota.numero_nfe ? <span className="font-bold text-blue-700">{String(nota.numero_nfe).padStart(9, "0")}</span> : <span className="text-gray-400 text-xs italic">-</span>}
                                  {nota.serie && <p className="text-[10px] text-gray-400 font-medium">Série: {nota.serie}</p>}
                                </>
                              )}
                            </div>
                          )
                        case "cliente":
                          return (
                            <div>
                              <p className="font-bold text-sm truncate max-w-[200px] text-slate-800">{nota.tomador_razao_social || nota.cliente_nome || "-"}</p>
                              {nota.tomador_cpf_cnpj && <p className="text-[10px] text-gray-400 font-medium">{nota.tomador_cpf_cnpj}</p>}
                            </div>
                          )
                        case "origem":
                          return (
                            <Badge variant="outline" className="text-xs font-semibold bg-white border border-slate-200">
                              {getOrigemLabel(nota.origem)}{nota.origem_numero && ` #${nota.origem_numero}`}
                            </Badge>
                          )
                        case "valor_total": return <span className="text-right font-black text-slate-800 text-sm">{showValues ? formatCurrency(nota.valor_total) : "R$ ****"}</span>
                        case "status": return getStatusBadge(nota.status)
                        case "data": return <span className="text-xs text-slate-600 font-semibold">{formatDateBR(nota.data_emissao || nota.created_at)}</span>
                        case "acoes":
                          return (
                            <div className="flex items-center justify-end gap-1">
                              {nota.tipo === "nfse" && (nota.status === "processando" || nota.status === "erro") && !nota.numero_nfse && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleConsultarNfse(nota.id)} disabled={consultandoId === nota.id} title="Consultar">
                                  {consultandoId === nota.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                              )}
                              {nota.tipo === "nfe" && (nota.status === "processando" || nota.status === "rejeitada") && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleConsultarNfe(nota.id)} disabled={consultandoId === nota.id} title="Consultar SEFAZ">
                                  {consultandoId === nota.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" onClick={() => handleVerDetalhes(nota)} title="Ver detalhes">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {((nota.tipo === "nfse" && (nota.status === "emitida" || nota.status === "cancelada")) || (nota.tipo === "nfe" && nota.status === "autorizada")) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleImprimir(nota)} title={nota.tipo === "nfse" ? "Imprimir NFS-e" : "Imprimir DANFE"}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                              )}
                              {((nota.tipo === "nfse" && nota.status === "emitida") || (nota.tipo === "nfe" && nota.status === "autorizada")) && (() => {
                                const notaNum = nota.tipo === "nfse" ? String(nota.numero_nfse || "") : String(nota.numero_nfe || "")
                                const boletoInfo = boletoStatusMap[notaNum]
                                if (boletoInfo?.temBoleto && boletoInfo.aguardandoPagamento) {
                                  return <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:bg-teal-50" onClick={() => { setVisualizarBoletosNumero(notaNum); setVisualizarBoletosOpen(true) }} title="Imprimir Boleto"><Receipt className="h-4 w-4" /></Button>
                                }
                                if (boletoInfo?.temBoleto) return null
                                return <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setNotaParaBoleto(nota); setBoletoOpen(true) }} title="Gerar Boleto"><DollarSign className="h-4 w-4" /></Button>
                              })()}
                              {((nota.tipo === "nfse" && nota.status === "emitida") || (nota.tipo === "nfe" && nota.status === "autorizada")) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setNotaCancelar(nota); setCancelarOpen(true) }} title={`Cancelar ${nota.tipo === "nfse" ? "NFS-e" : "NF-e"}`}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )
                        default: return null
                      }
                    }}
                  />
            )}
          </CardContent>
        </Card>

        {/* Info sobre credenciamento */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 border-2 rounded-2xl shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-blue-800">Sobre as Notas Fiscais</h4>
                <p className="text-xs md:text-sm text-blue-700 mt-1">
                  <strong>NFS-e (Serviço)</strong>: emitida via Prefeitura para mão de obra. <strong>NF-e (Material)</strong>: emitida via SEFAZ para materiais.
                  Configure certificados e dados fiscais em{" "}
                  <Link href="/configuracoes" className="underline font-bold text-blue-800 hover:text-blue-900">
                    Configurações
                  </Link>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Emitir NF-e (Material) */}
      <EmitirNfeDialog
        open={emitirNfeOpen}
        onOpenChange={setEmitirNfeOpen}
        onSuccess={() => fetchTodasNotas()}
      />

      {/* Dialogs NFS-e */}
      <EmitirNfseDialog
        open={emitirNfseOpen}
        onOpenChange={setEmitirNfseOpen}
        onSuccess={() => fetchTodasNotas()}
      />

      <DetalheNfseDialog
        open={detalheNfseOpen}
        onOpenChange={setDetalheNfseOpen}
        notaId={nfseSelecionada}
        onPrint={(id) => {
          setNotaImprimirNfse(id)
          setImprimirNfseOpen(true)
        }}
        onBoleto={(nota) => {
          setNotaParaBoleto(nota)
          setBoletoOpen(true)
        }}
      />

      <ImprimirNfseDialog
        open={imprimirNfseOpen}
        onOpenChange={setImprimirNfseOpen}
        notaId={notaImprimirNfse}
      />

      {/* Dialogs NF-e */}
      <DetalheNfeDialog
        open={detalheNfeOpen}
        onOpenChange={setDetalheNfeOpen}
        nfeId={nfeSelecionada}
        onPrint={(id) => {
          setDanfeNfeId(id)
          setDanfeOpen(true)
        }}
      />

      <DanfeDialog
        open={danfeOpen}
        onOpenChange={setDanfeOpen}
        nfeId={danfeNfeId}
      />

      {/* Boletos */}
      <NovoBoletoDialog
        open={boletoOpen}
        onOpenChange={(open) => {
          setBoletoOpen(open)
          if (!open) setNotaParaBoleto(null)
        }}
        notaFiscal={notaParaBoleto}
        onSuccess={() => {
          setBoletoOpen(false)
          setNotaParaBoleto(null)
          fetchTodasNotas()
        }}
      />

      <VisualizarBoletosDialog
        open={visualizarBoletosOpen}
        onOpenChange={setVisualizarBoletosOpen}
        numeroBase={visualizarBoletosNumero}
      />

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancelar {notaCancelar?.tipo === "nfse" ? "NFS-e" : "NF-e"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a {notaCancelar?.tipo === "nfse" ? "NFS-e" : "NF-e"}{" "}
              {notaCancelar?.numero || `#${notaCancelar?.id}`}?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Motivo do Cancelamento</label>
            <Textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Informe o motivo do cancelamento"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={cancelando || !motivoCancelamento}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
