"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import type { Cliente } from "@/components/cliente-combobox"
import { EquipamentoCombobox } from "@/components/equipamento-combobox"
import { CameraCapture } from "@/components/ordem-servico/camera-capture"
import { SignaturePad } from "@/components/ordem-servico/signature-pad"
import { getTipoServicoLabel } from "@/types/ordem-servico"
import {
  ArrowLeft,
  Save,
  FileText,
  User,
  Clock,
  Package,
  Trash2,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Camera,
  PenTool,
  ClipboardList,
  AlertTriangle,
  MapPin,
  Calendar,
} from "lucide-react"

interface Equipamento {
  id: number
  nome: string
  categoria: string
  valor_hora: number
  ativo: boolean
}

interface OrdemServicoItem {
  id: number
  equipamento_id: number
  equipamento_nome: string
  observacoes: string
  situacao: string
  equipamento_nome_atual?: string
  categoria?: string
  valor_hora?: number
  ativo?: boolean
}

interface Foto {
  id?: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_foto: "antes" | "durante" | "depois"
  descricao?: string
  created_at?: string
  preview?: string
  caminho?: string
}

interface Assinatura {
  id?: number
  tipo_assinatura: "tecnico" | "responsavel"
  assinatura_base64: string
  nome_assinante: string
  data_assinatura?: string
  tipo?: string
  nome?: string
  caminho?: string
}

interface OrdemServico {
  id: number
  numero: string
  cliente_id: number
  contrato_id?: number
  contrato_numero?: string
  tecnico_id?: number
  tecnico_name: string
  tecnico_email: string
  solicitado_por: string
  data_atual: string
  data_agendamento?: string
  data_execucao?: string
  horario_entrada: string
  horario_saida: string
  tipo_servico: string
  relatorio_visita: string
  descricao_defeito: string
  servico_realizado: string
  observacoes: string
  responsavel: string
  nome_responsavel: string
  situacao: string
  cliente: Cliente
  itens: OrdemServicoItem[]
  periodo_agendamento?: "" | "manha" | "tarde"
}

const TEXTO_SERVICO_PREVENTIVA = `1. Limpeza e Lubrificação dos portões de pedestre com verificação das fechaduras e/ou Eletroímãs.
2. Limpeza e Lubrificação dos portões de veículos com teste de fricção.
3. Teste dos sensores de anti-esmagamento.
4. Verificação dos cabos de aço ou cremalheiras.`

export default function EditarOrdemServicoPage() {
  const router = useRouter()
  const params = useParams()
  const ordemId = params.id as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [activeTab, setActiveTab] = useState("info")

  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [contratoNumero, setContratoNumero] = useState("")
  const [tecnicoName, setTecnicoName] = useState("")
  const [tecnicoEmail, setTecnicoEmail] = useState("")
  const [dataExecucao, setDataExecucao] = useState("")
  const [dataAgendamento, setDataAgendamento] = useState("")
  const [periodoAgendamento, setPeriodoAgendamento] = useState<"" | "manha" | "tarde">("")
  const [horarioEntrada, setHorarioEntrada] = useState("")
  const [horarioSaida, setHorarioSaida] = useState("")
  const [relatorioVisita, setRelatorioVisita] = useState("")
  const [servicoRealizado, setServicoRealizado] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [nomeResponsavel, setNomeResponsavel] = useState("")
  const [situacao, setSituacao] = useState("em_andamento")

  // Estados dos equipamentos
  const [itensEquipamentos, setItensEquipamentos] = useState<OrdemServicoItem[]>([])
  const [novoEquipamentoId, setNovoEquipamentoId] = useState<number | null>(null)

  // Estados das fotos e assinaturas
  const [fotos, setFotos] = useState<Foto[]>([])
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])

  // Função para formatar endereço completo
  const getEnderecoCompleto = (cliente: Cliente | null): string => {
    if (!cliente) return "Endereço não disponível"

    const partes = []
    if (cliente.endereco) partes.push(cliente.endereco)
    if (cliente.bairro) partes.push(cliente.bairro)
    if (cliente.cidade && cliente.estado) {
      partes.push(`${cliente.cidade}/${cliente.estado}`)
    } else if (cliente.cidade) {
      partes.push(cliente.cidade)
    } else if (cliente.estado) {
      partes.push(cliente.estado)
    }
    if (cliente.cep) partes.push(`CEP: ${cliente.cep}`)

    return partes.length > 0 ? partes.join(" - ") : "Endereço não disponível"
  }

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true)
        console.log(`[Frontend] Carregando dados da ordem ${ordemId}`)

        // Carregar ordem de serviço
        const ordemResponse = await fetch(`/api/ordens-servico/${ordemId}`)
        if (!ordemResponse.ok) {
          throw new Error("Erro ao carregar ordem de serviço")
        }
        const ordemData = await ordemResponse.json()

        if (!ordemData.success) {
          throw new Error(ordemData.error || "Erro ao carregar ordem de serviço")
        }

        const ordemServico = ordemData.data
        console.log("[Frontend] Ordem de serviço carregada:", ordemServico)
        setOrdem(ordemServico)

        // Buscar dados completos do cliente
        if (ordemServico.cliente_id) {
          console.log(`[Frontend] Buscando dados do cliente ${ordemServico.cliente_id}`)
          const clienteResponse = await fetch(`/api/clientes/${ordemServico.cliente_id}`)
          if (clienteResponse.ok) {
            const clienteData = await clienteResponse.json()
            if (clienteData.success && clienteData.data) {
              console.log("[Frontend] Dados do cliente carregados:", clienteData.data)
              setClienteSelecionado(clienteData.data)
            }
          } else {
            console.warn("[Frontend] Erro ao buscar dados do cliente")
            // Se falhar, usar dados do cliente da ordem
            if (ordemServico.cliente) {
              setClienteSelecionado(ordemServico.cliente)
            }
          }
        } else if (ordemServico.cliente) {
          setClienteSelecionado(ordemServico.cliente)
        }

        setContratoNumero(ordemServico.contrato_numero || "Cliente sem contrato")

        console.log("[Frontend] Verificando técnico atual:", {
          tecnico_name: ordemServico.tecnico_name,
          tecnico_email: ordemServico.tecnico_email,
        })

        console.log("[Frontend] Dados do usuário logado:", user)

        // Se os campos estiverem vazios ou com valores padrão, preencher automaticamente
        if (
          user &&
          (!ordemServico.tecnico_name ||
            ordemServico.tecnico_name === "A definir" ||
            ordemServico.tecnico_name.trim() === "")
        ) {
          console.log("[Frontend] Preenchendo nome do técnico automaticamente:", user.nome)
          setTecnicoName(user.nome || "")
        } else {
          setTecnicoName(ordemServico.tecnico_name || "")
        }

        if (user && (!ordemServico.tecnico_email || ordemServico.tecnico_email.trim() === "")) {
          console.log("[Frontend] Preenchendo email do técnico automaticamente:", user.email)
          setTecnicoEmail(user.email || "")
        } else {
          setTecnicoEmail(ordemServico.tecnico_email || "")
        }

        if (ordemServico.data_execucao) {
          const dataFormatada = ordemServico.data_execucao.split("T")[0]
          setDataExecucao(dataFormatada)
        }

        if (ordemServico.data_agendamento) {
          const dataFormatada = ordemServico.data_agendamento.split("T")[0]
          setDataAgendamento(dataFormatada)
        }

        if (ordemServico.periodo_agendamento) {
          setPeriodoAgendamento(ordemServico.periodo_agendamento)
        }

        setHorarioEntrada(ordemServico.horario_entrada || "")
        setHorarioSaida(ordemServico.horario_saida || "")
        setRelatorioVisita(ordemServico.relatorio_visita || "")
        setServicoRealizado(ordemServico.servico_realizado || "")
        setObservacoes(ordemServico.observacoes || "")
        setResponsavel(ordemServico.responsavel || "")
        setNomeResponsavel(ordemServico.nome_responsavel || "")

        // Definir situação: se for "aberta" ou "agendada", mudar para "em_andamento" por padrão na edição
        const situacaoAtual = ordemServico.situacao || "aberta"
        if (situacaoAtual === "aberta" || situacaoAtual === "agendada") {
          setSituacao("em_andamento")
        } else {
          setSituacao(situacaoAtual)
        }

        setItensEquipamentos(ordemServico.itens || [])

        // Carregar fotos
        const fotosResponse = await fetch(`/api/ordens-servico/${ordemId}/fotos`)
        if (fotosResponse.ok) {
          const fotosData = await fotosResponse.json()
          if (fotosData.success) {
            setFotos(fotosData.data)
          }
        }

        // Carregar assinaturas
        const assinaturasResponse = await fetch(`/api/ordens-servico/${ordemId}/assinaturas`)
        if (assinaturasResponse.ok) {
          const assinaturasData = await assinaturasResponse.json()
          if (assinaturasData.success) {
            setAssinaturas(assinaturasData.data)
          }
        }

        // Carregar equipamentos
        const equipamentosResponse = await fetch("/api/equipamentos")
        if (equipamentosResponse.ok) {
          const equipamentosData = await equipamentosResponse.json()
          if (equipamentosData.success) {
            setEquipamentos(equipamentosData.data)
          }
        }

        if (ordemServico.tipo_servico === "preventiva" && !ordemServico.relatorio_visita) {
          setRelatorioVisita(TEXTO_SERVICO_PREVENTIVA)
        }

        console.log("[Frontend] Carregamento completo!")
      } catch (error) {
        console.error("[Frontend] Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da ordem de serviço",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (ordemId) {
      carregarDados()
    }
  }, [ordemId, user]) // Adicionado 'user' à dependência do useEffect

  const validateExecucao = useCallback(() => {
    return !!(tecnicoName && dataExecucao && horarioEntrada && horarioSaida)
  }, [tecnicoName, dataExecucao, horarioEntrada, horarioSaida])

  const validateEquipamentos = useCallback(() => {
    return itensEquipamentos.length > 0
  }, [itensEquipamentos])

  const validateRelatorio = useCallback(() => {
    return !!(servicoRealizado || relatorioVisita)
  }, [servicoRealizado, relatorioVisita])

  const validateFotos = useCallback(() => {
    return fotos.length > 0
  }, [fotos])

  const canSign = useCallback(() => {
    return validateExecucao() && validateEquipamentos() && validateRelatorio()
  }, [validateExecucao, validateEquipamentos, validateRelatorio])

  const autoSave = useCallback(async () => {
    if (!clienteSelecionado || !ordem) return

    try {
      setAutoSaving(true)

      const ordemData = {
        cliente_id: clienteSelecionado.id,
        contrato_id: ordem?.contrato_id || null,
        contrato_numero: contratoNumero !== "Cliente sem contrato" ? contratoNumero : null,
        tecnico_name: tecnicoName,
        tecnico_email: tecnicoEmail,
        data_agendamento: dataAgendamento || null,
        periodo_agendamento: periodoAgendamento || null,
        data_execucao: dataExecucao || null,
        horario_entrada: horarioEntrada || null,
        horario_saida: horarioSaida || null,
        relatorio_visita: relatorioVisita,
        servico_realizado: servicoRealizado,
        observacoes: observacoes,
        responsavel: responsavel,
        nome_responsavel: nomeResponsavel,
        situacao: situacao,
      }

      const response = await fetch(`/api/ordens-servico/${ordemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ordemData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error("[v0] Erro no auto-save:", error)
    } finally {
      setAutoSaving(false)
    }
  }, [
    clienteSelecionado,
    ordem,
    ordemId,
    contratoNumero,
    tecnicoName,
    tecnicoEmail,
    dataAgendamento,
    periodoAgendamento,
    dataExecucao,
    horarioEntrada,
    horarioSaida,
    relatorioVisita,
    servicoRealizado,
    observacoes,
    responsavel,
    nomeResponsavel,
    situacao,
  ])

  useEffect(() => {
    if (!ordem) return // Não salvar antes de carregar a ordem

    const timer = setTimeout(() => {
      autoSave()
    }, 2000) // Salva 2 segundos após parar de digitar

    return () => clearTimeout(timer)
  }, [
    tecnicoName,
    tecnicoEmail,
    dataExecucao,
    horarioEntrada,
    horarioSaida,
    relatorioVisita,
    servicoRealizado,
    observacoes,
    responsavel,
    nomeResponsavel,
    situacao,
    dataAgendamento,
    periodoAgendamento,
    autoSave,
    ordem,
  ])

  const handleSalvarOrdem = async (comoRascunho = false) => {
    if (!clienteSelecionado || !tecnicoName) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const ordemData = {
        cliente_id: clienteSelecionado.id,
        contrato_id: ordem?.contrato_id || null,
        contrato_numero: contratoNumero !== "Cliente sem contrato" ? contratoNumero : null,
        tecnico_name: tecnicoName,
        tecnico_email: tecnicoEmail,
        data_agendamento: dataAgendamento || null,
        periodo_agendamento: periodoAgendamento || null,
        data_execucao: dataExecucao || null,
        horario_entrada: horarioEntrada || null,
        horario_saida: horarioSaida || null,
        relatorio_visita: relatorioVisita,
        servico_realizado: servicoRealizado,
        observacoes: observacoes,
        responsavel: responsavel,
        nome_responsavel: nomeResponsavel,
        situacao: comoRascunho ? "aberta" : situacao,
      }

      console.log("[Frontend] Salvando ordem:", ordemData)

      const response = await fetch(`/api/ordens-servico/${ordemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ordemData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao atualizar ordem de serviço")
      }

      toast({
        title: "Sucesso",
        description: comoRascunho
          ? "Alterações salvas! A ordem continua aberta."
          : `Ordem de serviço atualizada! Status: ${getSituacaoLabel(situacao)}`,
      })

      router.push("/ordem-servico")
    } catch (error) {
      console.error("[Frontend] Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar ordem de serviço",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAdicionarEquipamento = async () => {
    if (!novoEquipamentoId) {
      toast({
        title: "Erro",
        description: "Selecione um equipamento",
        variant: "destructive",
      })
      return
    }

    try {
      const equipamentoSelecionado = equipamentos.find((e) => e.id === novoEquipamentoId)
      if (!equipamentoSelecionado) return

      const itemData = {
        equipamento_id: novoEquipamentoId,
        equipamento_nome: equipamentoSelecionado.nome,
        quantidade: 1,
        observacoes: "",
        situacao: "pendente",
      }

      const response = await fetch(`/api/ordens-servico/${ordemId}/itens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.JSON(itemData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao adicionar equipamento")
      }

      const novoItem: OrdemServicoItem = {
        id: data.data.id,
        equipamento_id: novoEquipamentoId,
        equipamento_nome: equipamentoSelecionado.nome,
        observacoes: "",
        situacao: "pendente",
        equipamento_nome_atual: equipamentoSelecionado.nome,
        categoria: equipamentoSelecionado.categoria,
        valor_hora: equipamentoSelecionado.valor_hora,
        ativo: equipamentoSelecionado.ativo,
      }

      setItensEquipamentos((prev) => [...prev, novoItem])
      setNovoEquipamentoId(null)

      toast({
        title: "Sucesso",
        description: "Equipamento adicionado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar equipamento",
        variant: "destructive",
      })
    }
  }

  const handleRemoverEquipamento = async (itemId: number) => {
    try {
      const response = await fetch(`/api/ordens-servico/${ordemId}/itens/${itemId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao remover equipamento")
      }

      setItensEquipamentos((prev) => prev.filter((item) => item.id !== itemId))

      toast({
        title: "Sucesso",
        description: "Equipamento removido com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover equipamento",
        variant: "destructive",
      })
    }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case "aberta":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "agendada":
        return "bg-cyan-100 text-cyan-800 border-cyan-200"
      case "em_andamento":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "concluida":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSituacaoLabel = (situacao: string) => {
    switch (situacao) {
      case "aberta":
        return "ABERTA"
      case "agendada":
        return "AGENDADA"
      case "em_andamento":
        return "EM ANDAMENTO"
      case "concluida":
        return "CONCLUÍDA"
      default:
        return "ABERTA"
    }
  }

  const getSituacaoIcon = (situacao: string) => {
    switch (situacao) {
      case "aberta":
        return <Clock className="h-4 w-4" />
      case "agendada":
        return <Calendar className="h-4 w-4" />
      case "em_andamento":
        return <PlayCircle className="h-4 w-4" />
      case "concluida":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando ordem de serviço...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!ordem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Ordem de serviço não encontrada</h1>
            <Button onClick={() => router.push("/ordem-servico")}>Voltar para lista</Button>
          </div>
        </div>
      </div>
    )
  }

  const handleTabChange = (value: string) => {
    // Se tentar abrir aba de assinaturas sem validação, mostrar toast
    if (value === "assinaturas" && !canSign()) {
      const mensagens = []
      if (!validateExecucao()) {
        mensagens.push("• Preencha os dados de execução (técnico, data, horários)")
      }
      if (!validateEquipamentos()) {
        mensagens.push("• Selecione pelo menos um equipamento")
      }
      if (!validateRelatorio()) {
        mensagens.push("• Preencha o serviço realizado ou relatório da visita")
      }

      toast({
        title: "Não é possível assinar ainda",
        description: (
          <div className="mt-2 space-y-1">
            <p className="font-semibold">Complete os seguintes itens:</p>
            {mensagens.map((msg, i) => (
              <p key={i} className="text-sm">
                {msg}
              </p>
            ))}
          </div>
        ),
        variant: "destructive",
      })
      return
    }

    // Salvar antes de trocar de aba
    autoSave()
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pb-24 md:pb-6">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Executar Ordem de Serviço
            </h1>
            <p className="text-gray-600 mt-1 text-xs md:text-base">Complete as informações de execução do serviço</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
              <Badge variant="outline" className="font-mono text-[10px] md:text-sm">
                Número: {ordem.numero}
              </Badge>
              <Badge variant="outline" className={`text-[10px] md:text-sm ${getSituacaoColor(situacao)}`}>
                {getSituacaoIcon(situacao)}
                <span className="ml-1">{getSituacaoLabel(situacao)}</span>
              </Badge>
              {autoSaving && (
                <Badge variant="outline" className="text-[10px] md:text-sm bg-blue-50 text-blue-600">
                  <Save className="h-3 w-3 mr-1 animate-pulse" />
                  Salvando...
                </Badge>
              )}
              {lastSaved && !autoSaving && (
                <Badge variant="outline" className="text-[10px] md:text-sm bg-green-50 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Salvo {lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-white/80 backdrop-blur-sm flex-1 md:flex-none"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="md:inline">Voltar</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="info" className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] md:text-sm">
              <User className="h-3 w-3 md:h-4 md:w-4" />
              <span>Info</span>
              {validateExecucao() && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger
              value="equipamentos"
              className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] md:text-sm"
            >
              <Package className="h-3 w-3 md:h-4 md:w-4" />
              <span>Equip.</span>
              {validateEquipamentos() && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger
              value="relatorios"
              className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] md:text-sm"
            >
              <ClipboardList className="h-3 w-3 md:h-4 md:w-4" />
              <span>Relatório</span>
              {validateRelatorio() && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="fotos" className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] md:text-sm">
              <Camera className="h-3 w-3 md:h-4 md:w-4" />
              <span>Fotos</span>
              {validateFotos() && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger
              value="assinaturas"
              className={`flex flex-col items-center gap-1 py-2 px-1 text-[10px] md:text-sm ${
                !canSign() ? "opacity-50" : ""
              }`}
              disabled={!canSign()}
            >
              <PenTool className="h-3 w-3 md:h-4 md:w-4" />
              <span>Assin.</span>
              {canSign() ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-orange-600" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Informações */}
          <TabsContent value="info" className="space-y-4">
            {/* Informações Básicas */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 text-white rounded-t-lg p-3 md:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base md:text-xl">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  Informações da Ordem
                </CardTitle>
                <CardDescription className="text-gray-100 text-xs md:text-sm">
                  Dados básicos (não editáveis)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div>
                    <Label className="text-gray-500 text-xs">Cliente</Label>
                    <div className="font-medium text-gray-900">{clienteSelecionado?.nome || "Não informado"}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Tipo de Serviço</Label>
                    <div className="font-medium text-gray-900">{getTipoServicoLabel(ordem.tipo_servico)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Data de Criação</Label>
                    <div className="font-medium text-gray-900">
                      {ordem.data_atual
                        ? new Date(ordem.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                        : "Não informada"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Solicitado Por</Label>
                    <div className="font-medium text-gray-900">{ordem.solicitado_por || "Não informado"}</div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-500 flex items-center gap-2 text-xs">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      Endereço do Cliente
                    </Label>
                    <div className="font-medium text-gray-900 bg-blue-50 p-2 md:p-3 rounded-lg mt-1 text-xs">
                      {getEnderecoCompleto(clienteSelecionado)}
                    </div>
                  </div>
                  {ordem.descricao_defeito && (
                    <div className="md:col-span-2">
                      <Label className="text-gray-500 text-xs">Descrição do Problema</Label>
                      <div className="font-medium text-gray-900 bg-gray-50 p-2 md:p-3 rounded-lg mt-1 whitespace-pre-wrap text-xs">
                        {ordem.descricao_defeito}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dados de Execução */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-t-lg p-3 md:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base md:text-xl">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  Dados de Execução
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs md:text-sm">
                  Informações do técnico e execução do serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="tecnico_name" className="text-xs md:text-sm">
                        Nome do Técnico *
                      </Label>
                      <Input
                        id="tecnico_name"
                        value={tecnicoName}
                        onChange={(e) => setTecnicoName(e.target.value)}
                        placeholder="Nome do técnico responsável"
                        className="text-xs md:text-sm h-9 md:h-10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tecnico_email" className="text-xs md:text-sm">
                        Email do Técnico
                      </Label>
                      <Input
                        id="tecnico_email"
                        type="email"
                        value={tecnicoEmail}
                        onChange={(e) => setTecnicoEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="text-xs md:text-sm h-9 md:h-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Campo de Situação */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 md:p-4 rounded-lg border-2 border-blue-200">
                    <Label htmlFor="situacao" className="text-xs md:text-base font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      Situação da Ordem *
                    </Label>
                    <Select value={situacao} onValueChange={setSituacao}>
                      <SelectTrigger className="mt-2 bg-white h-9 md:h-10 text-xs md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberta">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                            <span>Aberta</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="agendada">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-cyan-600" />
                            <span>Agendada</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="em_andamento">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                            <span>Em Andamento</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="concluida">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                            <span>Concluída</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] md:text-xs text-gray-600 mt-2">
                      {situacao === "agendada" && "Serviço agendado para data futura"}
                      {situacao === "em_andamento" && "Serviço está sendo executado"}
                      {situacao === "concluida" && "Serviço finalizado"}
                      {situacao === "aberta" && "Aguardando início da execução"}
                    </p>
                  </div>

                  <Separator />

                  {ordem.situacao === "agendada" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <Label htmlFor="data_agendamento" className="text-xs md:text-sm">
                          Data de Agendamento
                        </Label>
                        <Input
                          id="data_agendamento"
                          type="date"
                          value={dataAgendamento}
                          onChange={(e) => setDataAgendamento(e.target.value)}
                          className="h-9 md:h-10"
                        />
                        <div className="text-[10px] md:text-xs text-gray-500 mt-1">Data agendada para a visita</div>
                      </div>

                      <div>
                        <Label htmlFor="periodo_agendamento" className="text-xs md:text-sm">
                          Período do Agendamento
                        </Label>
                        <Select
                          value={periodoAgendamento}
                          onValueChange={(value: "" | "manha" | "tarde") => setPeriodoAgendamento(value)}
                        >
                          <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manha">Manhã</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-[10px] md:text-xs text-gray-500 mt-1">Período da visita agendada</div>
                      </div>
                    </div>
                  )}

                  {ordem.situacao === "agendada" && <Separator />}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="data_execucao" className="text-xs md:text-sm">
                        Data de Execução
                      </Label>
                      <Input
                        id="data_execucao"
                        type="date"
                        value={dataExecucao}
                        onChange={(e) => setDataExecucao(e.target.value)}
                        className="h-9 md:h-10"
                      />
                      <div className="text-[10px] md:text-xs text-gray-500 mt-1">
                        Quando o serviço foi/será executado
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="horario_entrada" className="text-xs md:text-sm">
                        Hora de Entrada
                      </Label>
                      <Input
                        id="horario_entrada"
                        type="time"
                        value={horarioEntrada}
                        onChange={(e) => setHorarioEntrada(e.target.value)}
                        className="h-9 md:h-10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="horario_saida" className="text-xs md:text-sm">
                        Hora de Saída
                      </Label>
                      <Input
                        id="horario_saida"
                        type="time"
                        value={horarioSaida}
                        onChange={(e) => setHorarioSaida(e.target.value)}
                        className="h-9 md:h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="responsavel" className="text-xs md:text-sm">
                        Tipo de Responsável
                      </Label>
                      <Select value={responsavel} onValueChange={setResponsavel}>
                        <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zelador">Zelador</SelectItem>
                          <SelectItem value="porteiro">Porteiro</SelectItem>
                          <SelectItem value="sindico">Síndico</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="nome_responsavel" className="text-xs md:text-sm">
                        Nome do Responsável
                      </Label>
                      <Input
                        id="nome_responsavel"
                        value={nomeResponsavel}
                        onChange={(e) => setNomeResponsavel(e.target.value)}
                        placeholder="Nome completo"
                        className="h-9 md:h-10 text-xs md:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Equipamentos */}
          <TabsContent value="equipamentos">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-t-lg p-3 md:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base md:text-xl">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  Equipamentos
                </CardTitle>
                <CardDescription className="text-indigo-100 text-xs md:text-sm">
                  Gerencie os equipamentos da ordem
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="border rounded-lg p-3 md:p-4 bg-gradient-to-r from-gray-50 to-blue-50">
                    <h4 className="font-medium mb-3 text-gray-900 text-xs md:text-base">Adicionar Equipamento</h4>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                      <div className="flex-1">
                        <EquipamentoCombobox value={novoEquipamentoId} onValueChange={setNovoEquipamentoId} />
                      </div>
                      <Button
                        onClick={handleAdicionarEquipamento}
                        disabled={!novoEquipamentoId}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-9 md:h-10 text-xs md:text-sm"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    {itensEquipamentos.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 md:p-3 border-2 border-slate-200 rounded-lg bg-gradient-to-r from-white to-blue-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium text-gray-900 text-xs md:text-sm truncate">
                            {item.equipamento_nome_atual || item.equipamento_nome}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverEquipamento(item.id)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    ))}
                    {itensEquipamentos.length === 0 && (
                      <div className="text-center py-6 md:py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Package className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400 mb-3 md:mb-4" />
                        <div className="text-gray-600 text-xs md:text-base">Nenhum equipamento na ordem</div>
                        <div className="text-[10px] md:text-sm text-gray-500">
                          Use o formulário acima para adicionar equipamentos
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Relatórios */}
          <TabsContent value="relatorios">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 text-white rounded-t-lg p-3 md:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base md:text-xl">
                  <ClipboardList className="h-4 w-4 md:h-5 md:w-5" />
                  Relatórios e Observações
                </CardTitle>
                <CardDescription className="text-teal-100 text-xs md:text-sm">
                  Detalhes da execução do serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  {/* Manutenção: apenas Serviço Realizado e Observações Gerais */}
                  {ordem?.tipo_servico === "manutencao" && (
                    <>
                      <div>
                        <Label htmlFor="servico_realizado" className="text-xs md:text-sm">
                          Serviço Realizado
                        </Label>
                        <Textarea
                          id="servico_realizado"
                          value={servicoRealizado}
                          onChange={(e) => setServicoRealizado(e.target.value)}
                          placeholder="Descreva os serviços de manutenção que foram realizados..."
                          rows={6}
                          className="text-xs md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="observacoes" className="text-xs md:text-sm">
                          Observações Gerais
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Observações adicionais..."
                          rows={4}
                          className="text-xs md:text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Preventiva: Relatório da Visita e Necessidades do Cliente */}
                  {ordem?.tipo_servico === "preventiva" && (
                    <>
                      <div>
                        <Label htmlFor="relatorio_visita" className="text-xs md:text-sm">
                          Relatório da Visita
                        </Label>
                        <Textarea
                          id="relatorio_visita"
                          value={relatorioVisita}
                          onChange={(e) => setRelatorioVisita(e.target.value)}
                          placeholder="Descreva o que foi encontrado durante a visita..."
                          rows={8}
                          className="text-xs md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="observacoes" className="text-xs md:text-sm">
                          Necessidades do Cliente
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Adicione observações sobre necessidades específicas do cliente..."
                          rows={4}
                          className="text-xs md:text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Vistoria para Contrato: Relatório da Visita e Observações da Vistoria */}
                  {ordem?.tipo_servico === "vistoria_contrato" && (
                    <>
                      <div>
                        <Label htmlFor="relatorio_visita" className="text-xs md:text-sm">
                          Relatório da Visita
                        </Label>
                        <Textarea
                          id="relatorio_visita"
                          value={relatorioVisita}
                          onChange={(e) => setRelatorioVisita(e.target.value)}
                          placeholder="Descreva o que foi encontrado durante a vistoria..."
                          rows={6}
                          className="text-xs md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="observacoes" className="text-xs md:text-sm">
                          Observações da Vistoria
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Adicione observações sobre a vistoria do contrato..."
                          rows={4}
                          className="text-xs md:text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Orçamento: Relatório da Visita e Observações Gerais (sem Serviço Realizado) */}
                  {ordem?.tipo_servico === "orcamento" && (
                    <>
                      <div>
                        <Label htmlFor="relatorio_visita" className="text-xs md:text-sm">
                          Relatório da Visita
                        </Label>
                        <Textarea
                          id="relatorio_visita"
                          value={relatorioVisita}
                          onChange={(e) => setRelatorioVisita(e.target.value)}
                          placeholder="Descreva o que foi encontrado durante a visita de orçamento..."
                          rows={6}
                          className="text-xs md:text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="observacoes" className="text-xs md:text-sm">
                          Observações Gerais
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Observações sobre o orçamento..."
                          rows={4}
                          className="text-xs md:text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Outros tipos: Relatório, Serviço Realizado e Observações */}
                  {ordem?.tipo_servico !== "manutencao" &&
                    ordem?.tipo_servico !== "preventiva" &&
                    ordem?.tipo_servico !== "vistoria_contrato" &&
                    ordem?.tipo_servico !== "orcamento" && (
                      <>
                        <div>
                          <Label htmlFor="relatorio_visita" className="text-xs md:text-sm">
                            Relatório da Visita
                          </Label>
                          <Textarea
                            id="relatorio_visita"
                            value={relatorioVisita}
                            onChange={(e) => setRelatorioVisita(e.target.value)}
                            placeholder="Descreva o que foi encontrado durante a visita..."
                            rows={5}
                            className="text-xs md:text-sm"
                          />
                        </div>

                        <div>
                          <Label htmlFor="servico_realizado" className="text-xs md:text-sm">
                            Serviço Realizado
                          </Label>
                          <Textarea
                            id="servico_realizado"
                            value={servicoRealizado}
                            onChange={(e) => setServicoRealizado(e.target.value)}
                            placeholder="Descreva os serviços que foram realizados..."
                            rows={6}
                            className="text-xs md:text-sm"
                          />
                        </div>

                        <div>
                          <Label htmlFor="observacoes" className="text-xs md:text-sm">
                            Observações Gerais
                          </Label>
                          <Textarea
                            id="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Observações adicionais..."
                            rows={4}
                            className="text-xs md:text-sm"
                          />
                        </div>
                      </>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Fotos */}
          <TabsContent value="fotos">
            <CameraCapture
              ordemServicoId={Number.parseInt(ordemId)}
              fotos={fotos}
              onFotosChange={setFotos}
              disabled={false}
            />
          </TabsContent>

          {/* Tab 5: Assinaturas */}
          <TabsContent value="assinaturas">
            <SignaturePad
              ordemServicoId={Number.parseInt(ordemId)}
              assinaturas={assinaturas}
              onAssinaturasChange={setAssinaturas}
              disabled={false}
              nomeResponsavel={nomeResponsavel}
            />
          </TabsContent>
        </Tabs>

        {/* Botões de Ação - Versão Mobile Otimizada */}
        <div className="fixed md:relative bottom-0 left-0 right-0 bg-white md:bg-transparent border-t md:border-0 shadow-2xl md:shadow-xl p-3 md:p-4 z-50">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-row gap-2">
              <Button
                onClick={() => handleSalvarOrdem(true)}
                disabled={saving}
                variant="secondary"
                className="flex-1 h-10 md:h-auto text-xs md:text-sm"
                size="sm"
              >
                <Save className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Salvar </span>Rascunho
              </Button>
              <Button
                onClick={() => handleSalvarOrdem(false)}
                disabled={saving || !tecnicoName}
                className="flex-1 h-10 md:h-auto bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 hover:from-orange-600 hover:via-red-700 hover:to-pink-700 text-xs md:text-sm"
                size="sm"
              >
                <Save className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                {saving ? (
                  "Salvando..."
                ) : (
                  <>
                    <span className="hidden sm:inline">Salvar </span>Alterações
                  </>
                )}
              </Button>
            </div>

            <div className="mt-2 md:mt-4 grid grid-cols-5 gap-1 md:gap-2 text-[10px] md:text-xs">
              <button
                onClick={() => handleTabChange("info")}
                className={`flex flex-col md:flex-row items-center md:gap-1 p-2 rounded-lg transition-all ${
                  activeTab === "info"
                    ? "bg-blue-100 text-blue-700 md:bg-transparent md:text-gray-600"
                    : "text-gray-600 hover:bg-gray-100 md:hover:bg-transparent"
                } md:cursor-default cursor-pointer md:pointer-events-none`}
              >
                <User className="h-4 w-4 md:h-3 md:w-3" />
                <span className="hidden md:inline">{validateExecucao() ? "✓" : "○"}</span>
                <span className="md:hidden mt-1">{validateExecucao() ? "✓" : "○"}</span>
              </button>

              <button
                onClick={() => handleTabChange("equipamentos")}
                className={`flex flex-col md:flex-row items-center md:gap-1 p-2 rounded-lg transition-all ${
                  activeTab === "equipamentos"
                    ? "bg-purple-100 text-purple-700 md:bg-transparent md:text-gray-600"
                    : "text-gray-600 hover:bg-gray-100 md:hover:bg-transparent"
                } md:cursor-default cursor-pointer md:pointer-events-none`}
              >
                <Package className="h-4 w-4 md:h-3 md:w-3" />
                <span className="hidden md:inline">
                  {validateEquipamentos() ? "✓" : "○"} ({itensEquipamentos.length})
                </span>
                <span className="md:hidden mt-1">{validateEquipamentos() ? "✓" : "○"}</span>
              </button>

              <button
                onClick={() => handleTabChange("relatorios")}
                className={`flex flex-col md:flex-row items-center md:gap-1 p-2 rounded-lg transition-all ${
                  activeTab === "relatorios"
                    ? "bg-cyan-100 text-cyan-700 md:bg-transparent md:text-gray-600"
                    : "text-gray-600 hover:bg-gray-100 md:hover:bg-transparent"
                } md:cursor-default cursor-pointer md:pointer-events-none`}
              >
                <ClipboardList className="h-4 w-4 md:h-3 md:w-3" />
                <span className="hidden md:inline">{validateRelatorio() ? "✓" : "○"}</span>
                <span className="md:hidden mt-1">{validateRelatorio() ? "✓" : "○"}</span>
              </button>

              <button
                onClick={() => handleTabChange("fotos")}
                className={`flex flex-col md:flex-row items-center md:gap-1 p-2 rounded-lg transition-all ${
                  activeTab === "fotos"
                    ? "bg-green-100 text-green-700 md:bg-transparent md:text-gray-600"
                    : "text-gray-600 hover:bg-gray-100 md:hover:bg-transparent"
                } md:cursor-default cursor-pointer md:pointer-events-none`}
              >
                <Camera className="h-4 w-4 md:h-3 md:w-3" />
                <span className="hidden md:inline">
                  {validateFotos() ? "✓" : "○"} ({fotos.length})
                </span>
                <span className="md:hidden mt-1">{validateFotos() ? "✓" : "○"}</span>
              </button>

              <button
                onClick={() => handleTabChange("assinaturas")}
                className={`flex flex-col md:flex-row items-center md:gap-1 p-2 rounded-lg transition-all ${
                  activeTab === "assinaturas"
                    ? "bg-pink-100 text-pink-700 md:bg-transparent md:text-gray-600"
                    : canSign()
                      ? "text-gray-600 hover:bg-gray-100 md:hover:bg-transparent"
                      : "text-gray-400 cursor-not-allowed"
                } md:cursor-default cursor-pointer md:pointer-events-none`}
              >
                <PenTool className="h-4 w-4 md:h-3 md:w-3" />
                <span className="hidden md:inline">
                  {canSign() ? (assinaturas.length > 0 ? "✓" : "○") : "🔒"} ({assinaturas.length})
                </span>
                <span className="md:hidden mt-1">{canSign() ? (assinaturas.length > 0 ? "✓" : "○") : "🔒"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
