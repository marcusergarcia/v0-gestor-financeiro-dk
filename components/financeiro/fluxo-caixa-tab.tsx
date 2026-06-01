"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
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
  Wallet,
  CreditCard,
  TrendingUp,
  Plus,
  Upload,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Loader2,
  Trash2,
  FileSpreadsheet,
  Check,
  AlertCircle,
  FileText,
  ChevronsUpDown
} from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#a855f7", // Purple
]

interface Account {
  id: number
  nome: string
  tipo: "conta_corrente" | "cartao_credito" | "aplicacao"
  saldo_inicial: number
  data_saldo_inicial?: string | Date
  periodos_importados?: string
}

interface Transaction {
  id: number
  conta_id: number
  conta_nome?: string
  data: string
  descricao: string
  tipo: "entrada" | "saida"
  valor: number
  categoria: string
}

interface ChartData {
  mes: string
  entradas: number
  saidas: number
  saldo: number
  rendimentos?: number
}

const getCategoryBadgeStyles = (category: string) => {
  const cat = category || "Outros";
  switch (cat) {
    case "Faturamento":
    case "Outras Receitas":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40";
    case "Fornecedores":
      return "bg-stone-100 text-stone-700 dark:bg-stone-900/55 dark:text-stone-300 border-stone-200 dark:border-stone-800/50";
    case "Investimentos":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40";
    case "Impostos & Tributos":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30";
    case "Tecnologia & SaaS":
      return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/40";
    case "Transporte & Viagem":
      return "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-800/40";
    case "Combustível":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300/40 dark:border-amber-700/30";
    case "Alimentação":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40";
    case "Aluguel & Condomínio":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40";
    case "Energia Elétrica":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-850/30";
    case "Água, Esgoto & Gás":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/50 dark:border-sky-800/30";
    case "Internet & Telefone":
      return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200/50 dark:border-teal-800/40";
    case "Marketing & Anúncios":
      return "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200/50 dark:border-pink-800/40";
    case "Pessoal & Pro-labore":
      return "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/40";
    case "Tarifas Bancárias":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700/50";
    case "Material de Escritório":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/40";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/40";
  }
}

export function FluxoCaixaTab() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [selectedConta, setSelectedConta] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  const [categoriesList, setCategoriesList] = useState<{ nome: string; tipo: "entrada" | "saida" }[]>([
    { nome: "Faturamento", tipo: "entrada" },
    { nome: "Outras Receitas", tipo: "entrada" },
    { nome: "Investimentos", tipo: "entrada" },
    { nome: "Alimentação", tipo: "saida" },
    { nome: "Tecnologia & SaaS", tipo: "saida" },
    { nome: "Transporte & Viagem", tipo: "saida" },
    { nome: "Combustível", tipo: "saida" },
    { nome: "Impostos & Tributos", tipo: "saida" },
    { nome: "Aluguel & Condomínio", tipo: "saida" },
    { nome: "Energia Elétrica", tipo: "saida" },
    { nome: "Água, Esgoto & Gás", tipo: "saida" },
    { nome: "Internet & Telefone", tipo: "saida" },
    { nome: "Marketing & Anúncios", tipo: "saida" },
    { nome: "Pessoal & Pro-labore", tipo: "saida" },
    { nome: "Tarifas Bancárias", tipo: "saida" },
    { nome: "Material de Escritório", tipo: "saida" },
    { nome: "Fornecedores", tipo: "saida" },
    { nome: "Outras Despesas", tipo: "saida" },
    { nome: "Outros", tipo: "saida" }
  ])
  const [categorySearchVal, setCategorySearchVal] = useState("")
  const [newTxCatOpen, setNewTxCatOpen] = useState(false)
  const [openRowCatId, setOpenRowCatId] = useState<number | null>(null)
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<"entrada" | "saida">("saida")
  
  // New Account fields
  const [newAccNome, setNewAccNome] = useState("")
  const [newAccTipo, setNewAccTipo] = useState<"conta_corrente" | "cartao_credito" | "aplicacao">("conta_corrente")
  const [newAccSaldo, setNewAccSaldo] = useState("")
  const [newAccDataSaldo, setNewAccDataSaldo] = useState("2025-12-30")

  // New Transaction fields
  const [newTxConta, setNewTxConta] = useState("")
  const [newTxData, setNewTxData] = useState("")
  const [newTxDesc, setNewTxDesc] = useState("")
  const [newTxTipo, setNewTxTipo] = useState<"entrada" | "saida">("saida")
  const [newTxValor, setNewTxValor] = useState("")
  const [newTxCat, setNewTxCat] = useState("Outros")

  // File import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importTargetConta, setImportTargetConta] = useState("")
  const [importMonth, setImportMonth] = useState("")
  const [importYear, setImportYear] = useState("")

  const { toast } = useToast()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAccConfirm, setShowAccConfirm] = useState(false)
  const [showAccSuccess, setShowAccSuccess] = useState(false)
  const [importResult, setImportResult] = useState<{ count: number; total: number } | null>(null)
  const [duplicateImportAlert, setDuplicateImportAlert] = useState<{
    fileName: string;
    createdAt: string;
    contaId: string;
    importMonth: string;
    importYear: string;
  } | null>(null)

  const [showConciliationModal, setShowConciliationModal] = useState(false)
  const [conciliationMonth, setConciliationMonth] = useState("")
  const [conciliationYear, setConciliationYear] = useState("")
  const [conciliationFiles, setConciliationFiles] = useState<Record<number, File>>({})

  useEffect(() => {
    const today = new Date()
    setConciliationMonth(String(today.getMonth() + 1).padStart(2, "0"))
    setConciliationYear(String(today.getFullYear()))
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedConta, selectedPeriod])

  const loadData = async () => {
    try {
      setLoading(true)
      const accountsRes = await fetch("/api/financeiro/contas")
      const accountsData = await accountsRes.json()
      
      if (accountsData.success) {
        setAccounts(accountsData.data || [])
      }

      // Fetch categories list
      const catsRes = await fetch("/api/financeiro/categorias")
      const catsData = await catsRes.json()
      if (catsData.success) {
        setCategoriesList(catsData.data || [])
      }

      // Performance Optimization: Only load transaction list if both account and period are selected
      if (selectedConta !== "all" && selectedPeriod !== "all") {
        const txUrl = `/api/financeiro/transacoes?contaId=${selectedConta}`
        const transactionsRes = await fetch(txUrl)
        const transactionsData = await transactionsRes.json()
        if (transactionsData.success) {
          setTransactions(transactionsData.data || [])
        }
      } else {
        setTransactions([])
      }

      const flowRes = await fetch("/api/financeiro/fluxo-caixa")
      const flowData = await flowRes.json()
      
      if (flowData.success) {
        setChartData(flowData.data || [])
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do fluxo de caixa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const submitCreateAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccNome.trim() || !newAccTipo) return
    setShowAccConfirm(true)
  }

  const executeCreateAccount = async () => {
    setShowAccConfirm(false)
    try {
      const response = await fetch("/api/financeiro/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newAccNome,
          tipo: newAccTipo,
          saldo_inicial: parseFloat(newAccSaldo) || 0,
          data_saldo_inicial: newAccDataSaldo
        })
      })

      const result = await response.json()
      if (result.success) {
        setNewAccNome("")
        setNewAccSaldo("")
        setNewAccDataSaldo("2025-12-30")
        setShowAccSuccess(true)
        await loadData()
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao criar conta", variant: "destructive" })
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTxConta || !newTxData || !newTxDesc || !newTxValor) {
      toast({ title: "Aviso", description: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/financeiro/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conta_id: newTxConta,
          data: newTxData,
          descricao: newTxDesc,
          tipo: newTxTipo,
          valor: parseFloat(newTxValor) || 0,
          categoria: newTxCat
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: "Sucesso", description: "Transação registrada com sucesso!" })
        setNewTxDesc("")
        setNewTxValor("")
        await loadData()
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao registrar transação", variant: "destructive" })
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return
    try {
      const response = await fetch(`/api/financeiro/transacoes/${id}`, {
        method: "DELETE"
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Sucesso", description: "Transação excluída com sucesso!" })
        await loadData()
      } else {
        toast({ title: "Erro", description: result.error || "Erro ao excluir transação", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Erro", description: "Erro de rede ao excluir transação", variant: "destructive" })
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const res = await fetch("/api/financeiro/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newCategoryName, tipo: newCategoryType })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Sucesso", description: `Categoria "${newCategoryName}" criada!` })
        setNewCategoryName("")
        await loadData()
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro de conexão ao criar categoria", variant: "destructive" })
    }
  }

  const handleRemoveCategory = async (nome: string) => {
    if (!confirm(`Tem certeza que deseja remover a categoria "${nome}"?`)) return
    try {
      const res = await fetch(`/api/financeiro/categorias?nome=${encodeURIComponent(nome)}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Sucesso", description: `Categoria "${nome}" removida!` })
        await loadData()
      } else {
        toast({ title: "Não é possível remover", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro de conexão ao remover categoria", variant: "destructive" })
    }
  }

  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile || !importTargetConta) {
      toast({ title: "Aviso", description: "Selecione o arquivo e a conta de destino", variant: "destructive" })
      return
    }

    try {
      setImporting(true)
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        
        const response = await fetch("/api/financeiro/transacoes/importar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: text,
            fileName: importFile.name,
            contaId: importTargetConta,
            importMonth: importMonth || undefined,
            importYear: importYear || undefined
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setImportResult({ count: result.count, total: result.total })
          setImportFile(null)
          setImportTargetConta("")
          setImportMonth("")
          setImportYear("")
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          await loadData()
        } else if (result.alreadyImported) {
          setDuplicateImportAlert({
            fileName: result.fileName,
            createdAt: result.createdAt,
            contaId: importTargetConta,
            importMonth,
            importYear
          })
        } else {
          toast({ title: "Erro na importação", description: result.error || "Erro na importação", variant: "destructive" })
        }
        setImporting(false)
      }
      reader.readAsText(importFile)
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao ler arquivo", variant: "destructive" })
      setImporting(false)
    }
  }

  const executeForceImport = async () => {
    if (!duplicateImportAlert) return
    const { contaId, importMonth, importYear } = duplicateImportAlert
    const file = importFile || conciliationFiles[Number(contaId)]
    if (!file) {
      toast({ title: "Erro", description: "Arquivo de extrato não encontrado para forçar a importação", variant: "destructive" })
      return
    }
    setDuplicateImportAlert(null)
    
    try {
      setImporting(true)
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        
        const response = await fetch("/api/financeiro/transacoes/importar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: text,
            fileName: file.name,
            contaId,
            importMonth: importMonth || undefined,
            importYear: importYear || undefined,
            forceImport: true
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setImportResult({ count: result.count, total: result.total })
          setImportFile(null)
          setImportTargetConta("")
          setImportMonth("")
          setImportYear("")
          setConciliationFiles(prev => {
            const copy = { ...prev }
            delete copy[Number(contaId)]
            return copy
          })
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          await loadData()
        } else {
          toast({ title: "Erro na importação", description: result.error || "Erro na importação", variant: "destructive" })
        }
        setImporting(false)
      }
      reader.readAsText(file)
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao forçar importação", variant: "destructive" })
      setImporting(false)
    }
  }

  const handleConciliationImport = async (contaId: number) => {
    const file = conciliationFiles[contaId]
    if (!file) {
      toast({ title: "Aviso", description: "Por favor, selecione um arquivo para importar.", variant: "destructive" })
      return
    }

    try {
      setImporting(true)
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        
        const response = await fetch("/api/financeiro/transacoes/importar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: text,
            fileName: file.name,
            contaId: String(contaId),
            importMonth: conciliationMonth,
            importYear: conciliationYear
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setImportResult({ count: result.count, total: result.total })
          setConciliationFiles(prev => {
            const copy = { ...prev }
            delete copy[contaId]
            return copy
          })
          await loadData()
        } else if (result.alreadyImported) {
          setDuplicateImportAlert({
            fileName: result.fileName,
            createdAt: result.createdAt,
            contaId: String(contaId),
            importMonth: conciliationMonth,
            importYear: conciliationYear
          })
        } else {
          toast({ title: "Erro na importação", description: result.error || "Erro na importação", variant: "destructive" })
        }
        setImporting(false)
      }
      reader.readAsText(file)
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao ler arquivo", variant: "destructive" })
      setImporting(false)
    }
  }

  const getAccountIcon = (tipo: string) => {
    switch (tipo) {
      case "conta_corrente":
        return <Building className="h-5 w-5 text-blue-500" />
      case "cartao_credito":
        return <CreditCard className="h-5 w-5 text-indigo-500" />
      default:
        return <Wallet className="h-5 w-5 text-emerald-500" />
    }
  };

  const getAccountTypeLabel = (tipo: string) => {
    switch (tipo) {
      case "conta_corrente":
        return "Conta Corrente"
      case "cartao_credito":
        return "Cartão de Crédito"
      default:
        return "Investimentos/Aplicação"
    }
  }

  const periods = chartData.map((d) => ({
    value: (d as any).periodo || d.mes,
    label: d.mes
  }))

  const currentPeriodData = (() => {
    const initialBalanceTotal = accounts.reduce((acc, a) => acc + (parseFloat(a.saldo_inicial as any) || 0), 0)
    let runningBalance = initialBalanceTotal

    const chartDataWithBalances = chartData.map((d) => {
      const saldoAnterior = runningBalance
      // running balance accumulates ONLY realized entries to match actual accounts balance
      const resultadoRealizado = d.entradas - d.saidas
      const saldoFinal = saldoAnterior + resultadoRealizado
      runningBalance = saldoFinal
      
      const resultadoMes = (d.entradas + ((d as any).entradasProjetadas || 0)) - (d.saidas + ((d as any).saidasProjetadas || 0))
      
      return {
        ...d,
        saldoAnterior,
        resultadoMes,
        resultadoRealizado,
        saldoFinal,
      }
    })

    if (selectedPeriod === "all") {
      const totalEntradasRealizadas = chartDataWithBalances.reduce((acc, d) => acc + d.entradas, 0)
      const totalEntradasProjetadas = chartDataWithBalances.reduce((acc, d) => acc + ((d as any).entradasProjetadas || 0), 0)
      const totalSaidasRealizadas = chartDataWithBalances.reduce((acc, d) => acc + d.saidas, 0)
      const totalSaidasProjetadas = chartDataWithBalances.reduce((acc, d) => acc + ((d as any).saidasProjetadas || 0), 0)
      
      return {
        entradas: totalEntradasRealizadas,
        entradasProjetadas: totalEntradasProjetadas,
        saidas: totalSaidasRealizadas,
        saidasProjetadas: totalSaidasProjetadas,
        saldo: totalEntradasRealizadas - totalSaidasRealizadas, // Realized liquid result
        saldoAnterior: initialBalanceTotal,
        saldoFinal: runningBalance,
        rendimentos: chartDataWithBalances.reduce((acc, d) => acc + (d.rendimentos || 0), 0),
      }
    } else {
      const found = chartDataWithBalances.find((d) => d.mes === selectedPeriod || (d as any).periodo === selectedPeriod)
      if (found) {
        return {
          entradas: found.entradas,
          entradasProjetadas: (found as any).entradasProjetadas || 0,
          saidas: found.saidas,
          saidasProjetadas: (found as any).saidasProjetadas || 0,
          saldo: found.entradas - found.saidas, // Realized monthly balance
          saldoAnterior: found.saldoAnterior,
          saldoFinal: found.saldoFinal,
          rendimentos: found.rendimentos || 0,
        }
      }
      return {
        entradas: 0,
        entradasProjetadas: 0,
        saidas: 0,
        saidasProjetadas: 0,
        saldo: 0,
        saldoAnterior: initialBalanceTotal,
        saldoFinal: initialBalanceTotal,
        rendimentos: 0
      }
    }
  })()

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedPeriod === "all") return true
    try {
      const d = new Date(tx.data)
      if (isNaN(d.getTime())) return false
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const txPeriod = `${year}-${month}`
      let label = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
      label = label.replace(/^\w/, (c) => c.toUpperCase()).replace(".", "")
      return txPeriod === selectedPeriod || label === selectedPeriod
    } catch {
      return false
    }
  })

  // Compute category statistics for the filtered transactions
  const categoryStats: Record<string, { total: number; count: number; tipo: "entrada" | "saida" }> = {}
  filteredTransactions.forEach((tx) => {
    const cat = tx.categoria || "Outros"
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, count: 0, tipo: tx.tipo }
    }
    categoryStats[cat].total += Math.abs(tx.valor)
    categoryStats[cat].count += 1
  })

  const pieData = Object.entries(categoryStats).map(([name, stat]) => ({
    name,
    value: parseFloat(stat.total.toFixed(2)),
    count: stat.count,
    tipo: stat.tipo,
  }))

  // Dynamic calculations for pending statements check
  const today = new Date()
  const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  const pendingImports: { contaId: number; contaNome: string; periodo: string; rotulo: string; mes: string; ano: string }[] = []
  
  for (const acc of accounts) {
    if (acc.tipo === "aplicacao") continue
    const imported = acc.periodos_importados ? acc.periodos_importados.split(",") : []
    
    let start: Date
    try {
      const rawDate = acc.data_saldo_inicial
      if (rawDate && (rawDate as any) instanceof Date) {
        start = rawDate as Date
      } else if (typeof rawDate === "string") {
        const cleanStr = rawDate.split("T")[0]
        const parts = cleanStr.split("-").map(Number)
        if (parts.length === 3) {
          start = new Date(parts[0], parts[1] - 1, parts[2])
        } else {
          start = new Date(2025, 11, 30)
        }
      } else {
        start = new Date(2025, 11, 30)
      }
      if (isNaN(start.getTime())) {
        start = new Date(2025, 11, 30)
      }
    } catch {
      start = new Date(2025, 11, 30)
    }
    
    if (!isNaN(start.getTime())) {
      // Start checking from the month AFTER the initial balance date month
      // E.g., if initial balance is 2025-12-30, start checking from 2026-01
      const checkDate = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      
      while (checkDate <= prevDate) {
        const year = checkDate.getFullYear()
        const month = String(checkDate.getMonth() + 1).padStart(2, "0")
        const periodKey = `${year}-${month}`
        
        if (!imported.includes(periodKey)) {
          const monthLabel = checkDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
          pendingImports.push({
            contaId: acc.id,
            contaNome: acc.nome,
            periodo: periodKey,
            rotulo: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            mes: month,
            ano: String(year)
          })
        }
        
        // Move to next month
        checkDate.setMonth(checkDate.getMonth() + 1)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications / Pending imports */}
      {pendingImports.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <span className="animate-bounce">🔔</span> Conciliações Bancárias Pendentes
            </CardTitle>
            <CardDescription className="text-xs text-amber-700/80 dark:text-amber-500/80">
              Identificamos que os extratos a seguir ainda não foram importados para o sistema:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pendingImports.map((pending, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border">
                <div>
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>{pending.contaNome}</span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono">
                      {pending.rotulo}
                    </span>
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">O extrato referente a este período precisa ser importado para fechar o caixa.</p>
                </div>
                <Button
                  onClick={() => {
                    setImportTargetConta(String(pending.contaId))
                    setImportMonth(pending.mes)
                    setImportYear(pending.ano)
                    document.getElementById("import-card-wrapper")?.scrollIntoView({ behavior: "smooth" })
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs border-amber-300 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-800 dark:text-amber-400 h-8 self-end sm:self-center"
                >
                  Importar Agora
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {/* Period Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
        <div>
          <h3 className="font-bold text-foreground text-base">Filtro de Período</h3>
          <p className="text-xs text-muted-foreground">Monitore os indicadores consolidados ou filtre mês a mês</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowConciliationModal(true)}
            variant="outline"
            className="h-9 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 gap-2 text-xs font-semibold"
          >
            📊 Centro de Conciliação
          </Button>
          <Button
            onClick={() => setShowManageCategoriesModal(true)}
            variant="outline"
            className="h-9 border-border hover:bg-muted/50 text-foreground gap-2 text-xs font-semibold"
          >
            🏷️ Categorias
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-56 h-9 border-border bg-card text-foreground">
                <SelectValue placeholder="Todos os períodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Receitas</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0.5">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Boletos a pagar + Créditos a receber:</span>
                <span className="font-semibold text-foreground">{formatCurrency(currentPeriodData.entradasProjetadas)}</span>
              </div>
              {currentPeriodData.entradas > 0 && (
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Boletos pagos + Créditos Recebidos:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(currentPeriodData.entradas)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-border pt-2 mt-1">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(currentPeriodData.entradas + currentPeriodData.entradasProjetadas)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total de Receitas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Despesas</span>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0.5">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Cartão a Pagar:</span>
                <span className="font-semibold text-foreground">{formatCurrency(currentPeriodData.saidasProjetadas)}</span>
              </div>
              {currentPeriodData.saidas > 0 && (
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Despesas Pagas:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(currentPeriodData.saidas)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-border pt-2 mt-1">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(currentPeriodData.saidas + currentPeriodData.saidasProjetadas)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total de Despesas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Resultado Líquido</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground border-b border-border/50 pb-1">
              <span>Saldo Anterior:</span>
              <span className="font-semibold text-foreground">{formatCurrency((currentPeriodData as any).saldoAnterior || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground pb-1">
              <span>{selectedPeriod === "all" ? "Resultado Período:" : "Resultado Mês:"}</span>
              <span className={`font-bold ${currentPeriodData.saldo >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}`}>
                {currentPeriodData.saldo >= 0 ? "+" : ""}{formatCurrency(currentPeriodData.saldo)}
              </span>
            </div>
            {((currentPeriodData as any).rendimentos > 0) && (
              <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-500 border-b border-border/50 pb-1">
                <span>Rendimento Juros (Aplicação):</span>
                <span className="font-semibold">+{formatCurrency((currentPeriodData as any).rendimentos)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs font-bold border-t border-border pt-1.5 mt-0.5">
              <span>Saldo Final:</span>
              <span className={`text-xs ${(currentPeriodData as any).saldoFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency((currentPeriodData as any).saldoFinal || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Financial accounts list summary */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Contas Cadastradas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[95px] overflow-y-auto pr-1.5 pt-1">
            <div className="space-y-1.5">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {getAccountIcon(acc.tipo)}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">{acc.nome}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">{getAccountTypeLabel(acc.tipo)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground">{formatCurrency(acc.saldo_inicial)}</span>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="text-[10px] text-muted-foreground py-2 text-center">Nenhuma conta cadastrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Section */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-500" />
            Fluxo de Caixa Mensal Consolidado
          </CardTitle>
          <CardDescription>
            Resultado consolidado contendo Boletos Pagos, Recibos de Receitas e Extratos Importados
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                  labelClassName="text-foreground font-bold"
                />
                <Legend />
                <Bar dataKey="entradas" stackId="entradas" fill="#10b981" name="Receitas (Realizadas)" />
                <Bar dataKey="entradasProjetadas" stackId="entradas" fill="#6ee7b7" name="Receitas (Futuras/Projetadas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" stackId="saidas" fill="#ef4444" name="Despesas (Realizadas)" />
                <Bar dataKey="saidasProjetadas" stackId="saidas" fill="#fca5a5" name="Despesas (Futuras/Projetadas)" radius={[4, 4, 0, 0]} />
                <Area type="monotone" dataKey="saldo" fill="#6366f1" stroke="#4f46e5" fillOpacity={0.1} name="Saldo Mensal" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados suficientes para gerar o fluxo gráfico. Importe lançamentos para começar.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action panels: Add account, add transaction, import statement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Account & File Import Panel */}
        <div className="space-y-6">
          {/* New account card */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-500" />
                Cadastrar Nova Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCreateAccount} className="space-y-3">
                <div>
                  <Label htmlFor="acc-nome" className="text-xs">Nome da Conta / Banco</Label>
                  <Input
                    id="acc-nome"
                    placeholder="Ex: Itaú Empresa, Cartão de Crédito XP"
                    value={newAccNome}
                    onChange={(e) => setNewAccNome(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="acc-tipo" className="text-xs">Tipo de Conta</Label>
                  <Select value={newAccTipo} onValueChange={(val: any) => setNewAccTipo(val)}>
                    <SelectTrigger id="acc-tipo" className="h-9 mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="aplicacao">Investimentos / Aplicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="acc-saldo" className="text-xs">Saldo Inicial (R$)</Label>
                  <Input
                    id="acc-saldo"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAccSaldo}
                    onChange={(e) => setNewAccSaldo(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="acc-data-saldo" className="text-xs">Data de Referência do Saldo Inicial</Label>
                  <Input
                    id="acc-data-saldo"
                    type="date"
                    value={newAccDataSaldo}
                    onChange={(e) => setNewAccDataSaldo(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs">
                  Cadastrar Conta
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Import statement card */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-indigo-500" />
                Importar Extrato Bancário
              </CardTitle>
              <CardDescription className="text-xs">Suporta arquivos OFX e CSV separados por vírgula/ponto-e-vírgula</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImportFile} className="space-y-3">
                <div>
                  <Label htmlFor="imp-target" className="text-xs">Importar para qual conta?</Label>
                  <Select value={importTargetConta} onValueChange={setImportTargetConta}>
                    <SelectTrigger id="imp-target" className="h-9 mt-1">
                      <SelectValue placeholder="Selecione a conta destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.nome} ({getAccountTypeLabel(acc.tipo)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imp-month" className="text-xs">Mês de Referência</Label>
                  <Select value={importMonth || "clear_month"} onValueChange={(val) => setImportMonth(val === "clear_month" ? "" : val)}>
                    <SelectTrigger id="imp-month" className="h-9 mt-1">
                      <SelectValue placeholder="Automático (do extrato)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear_month">Automático (do extrato)</SelectItem>
                      <SelectItem value="01">Janeiro</SelectItem>
                      <SelectItem value="02">Fevereiro</SelectItem>
                      <SelectItem value="03">Março</SelectItem>
                      <SelectItem value="04">Abril</SelectItem>
                      <SelectItem value="05">Maio</SelectItem>
                      <SelectItem value="06">Junho</SelectItem>
                      <SelectItem value="07">Julho</SelectItem>
                      <SelectItem value="08">Agosto</SelectItem>
                      <SelectItem value="09">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imp-year" className="text-xs">Ano de Referência</Label>
                  <Select value={importYear || "clear_year"} onValueChange={(val) => setImportYear(val === "clear_year" ? "" : val)}>
                    <SelectTrigger id="imp-year" className="h-9 mt-1">
                      <SelectValue placeholder="Automático (do extrato)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear_year">Automático (do extrato)</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imp-file" className="text-xs">Arquivo de Extrato</Label>
                  <Input
                    id="imp-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".ofx,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="h-9 mt-1 pt-1.5 cursor-pointer"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={importing || !importFile || !importTargetConta}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Importar Extrato
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transactions list & manual entries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manual transaction form card */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-500" />
                Registrar Movimentação Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTransaction} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="tx-conta" className="text-xs">Conta Financeira *</Label>
                  <Select value={newTxConta} onValueChange={setNewTxConta}>
                    <SelectTrigger id="tx-conta" className="h-9 mt-1">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.nome} ({getAccountTypeLabel(acc.tipo)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="tx-data" className="text-xs">Data da Operação *</Label>
                  <Input
                    id="tx-data"
                    type="date"
                    value={newTxData}
                    onChange={(e) => setNewTxData(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="tx-desc" className="text-xs">Descrição / Histórico *</Label>
                  <Input
                    id="tx-desc"
                    placeholder="Ex: Assinatura Software, Transferência recebida"
                    value={newTxDesc}
                    onChange={(e) => setNewTxDesc(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="tx-tipo" className="text-xs">Tipo *</Label>
                  <Select value={newTxTipo} onValueChange={(val: any) => setNewTxTipo(val)}>
                    <SelectTrigger id="tx-tipo" className="h-9 mt-1">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                      <SelectItem value="saida">Saída (Despesa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="tx-cat" className="text-xs">Categoria</Label>
                  <Popover open={newTxCatOpen} onOpenChange={setNewTxCatOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="tx-cat"
                        variant="outline"
                        role="combobox"
                        className="w-full h-9 mt-1 justify-between text-xs font-normal border-border bg-card hover:bg-muted/50 text-foreground"
                      >
                        {newTxCat || "Selecione a categoria"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-card border-border">
                      <Command className="bg-card">
                        <CommandInput placeholder="Buscar categoria..." className="h-9 text-xs" value={categorySearchVal} onValueChange={setCategorySearchVal} />
                        <CommandList>
                          <CommandEmpty className="p-2 text-[11px] text-muted-foreground flex flex-col gap-1.5 items-center">
                            <span>Nenhuma encontrada.</span>
                            {categorySearchVal.trim() && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-6 text-[10px] w-full"
                                onClick={async () => {
                                  const val = categorySearchVal.trim();
                                  if (val) {
                                    try {
                                      const res = await fetch("/api/financeiro/categorias", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ nome: val, tipo: newTxTipo })
                                      })
                                      const data = await res.json()
                                      if (data.success) {
                                        setCategoriesList(prev => Array.from(new Set([...prev, { nome: val, tipo: newTxTipo }])));
                                        setNewTxCat(val);
                                        setCategorySearchVal("");
                                        setNewTxCatOpen(false);
                                      } else {
                                        toast({ title: "Erro", description: data.error, variant: "destructive" })
                                      }
                                    } catch {
                                      toast({ title: "Erro", description: "Erro ao criar categoria", variant: "destructive" })
                                    }
                                  }
                                }}
                              >
                                Criar "{categorySearchVal}"
                              </Button>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {categoriesList.map((cat) => (
                              <CommandItem
                                key={cat.nome}
                                value={cat.nome}
                                onSelect={() => {
                                  setNewTxCat(cat.nome);
                                  setNewTxCatOpen(false);
                                }}
                                className="text-xs cursor-pointer hover:bg-muted/50"
                              >
                                <Check
                                  className={`mr-2 h-3 w-3 ${newTxCat === cat.nome ? "opacity-100" : "opacity-0"}`}
                                />
                                {cat.nome} <span className="text-[9px] text-muted-foreground ml-1">({cat.tipo === "entrada" ? "Crédito" : "Débito"})</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="tx-val" className="text-xs">Valor da Transação (R$) *</Label>
                  <Input
                    id="tx-val"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newTxValor}
                    onChange={(e) => setNewTxValor(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs px-6">
                    Registrar Lançamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Transactions list card */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Extrato da Conta Selecionada</CardTitle>
                <CardDescription className="text-xs">Transações importadas ou lançadas manualmente</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={selectedConta} onValueChange={setSelectedConta}>
                  <SelectTrigger className="w-60 h-8 text-xs">
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={String(acc.id)}>
                        {acc.nome} ({getAccountTypeLabel(acc.tipo)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    {periods.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedConta === "all" || selectedPeriod === "all" ? (
                <div className="text-center py-10 px-4 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🔍</span>
                  <p className="font-semibold text-foreground">Filtro Requerido</p>
                  <p className="max-w-[280px]">Selecione uma conta e um período de referência específicos para visualizar o extrato detalhado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
                  {/* Left Column: Transaction list (7 cols) */}
                  <div className="lg:col-span-7 max-h-[400px] overflow-y-auto divide-y divide-border">
                    {filteredTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.tipo === "entrada" ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40"}`}>
                            {tx.tipo === "entrada" ? (
                              <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground">{tx.descricao}</h4>
                              <Popover open={openRowCatId === tx.id} onOpenChange={(open) => { setOpenRowCatId(open ? tx.id : null); if (!open) setCategorySearchVal(""); }}>
                                <PopoverTrigger asChild>
                                  <button className={`h-6 px-2.5 py-0.5 text-[10px] font-semibold border rounded-full w-auto flex gap-1.5 items-center justify-between cursor-pointer transition-all hover:opacity-85 focus:ring-0 shadow-sm ${getCategoryBadgeStyles(tx.categoria)}`}>
                                    <span>{tx.categoria || "Outros"}</span>
                                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0 bg-card border-border">
                                  <Command className="bg-card">
                                    <CommandInput placeholder="Buscar categoria..." className="h-9 text-xs" value={categorySearchVal} onValueChange={setCategorySearchVal} />
                                    <CommandList>
                                      <CommandEmpty className="p-2 text-[11px] text-muted-foreground flex flex-col gap-1.5 items-center">
                                        <span>Nenhuma encontrada.</span>
                                        {categorySearchVal.trim() && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="h-6 text-[10px] w-full"
                                            onClick={async () => {
                                              const val = categorySearchVal.trim();
                                              if (val) {
                                                try {
                                                  await fetch("/api/financeiro/categorias", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ nome: val, tipo: tx.tipo })
                                                  })
                                                  setCategoriesList(prev => Array.from(new Set([...prev, { nome: val, tipo: tx.tipo }])));
                                                  const response = await fetch(`/api/financeiro/transacoes/${tx.id}`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ categoria: val }),
                                                  })
                                                  const result = await response.json()
                                                  if (result.success) {
                                                    toast({ title: "Sucesso", description: "Categoria atualizada!" })
                                                    setCategorySearchVal("");
                                                    setOpenRowCatId(null);
                                                    await loadData()
                                                  }
                                                } catch (err) {
                                                  console.error(err)
                                                }
                                              }
                                            }}
                                          >
                                            Criar "{categorySearchVal}"
                                          </Button>
                                        )}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {categoriesList.map((cat) => (
                                          <CommandItem
                                            key={cat.nome}
                                            value={cat.nome}
                                            onSelect={async () => {
                                              try {
                                                const response = await fetch(`/api/financeiro/transacoes/${tx.id}`, {
                                                  method: "PATCH",
                                                  headers: { "Content-Type": "application/json" },
                                                  body: JSON.stringify({ categoria: cat.nome }),
                                                })
                                                const result = await response.json()
                                                if (result.success) {
                                                  toast({ title: "Sucesso", description: "Categoria atualizada!" })
                                                  setOpenRowCatId(null);
                                                  await loadData()
                                                } else {
                                                  toast({ title: "Erro", description: "Erro ao atualizar", variant: "destructive" })
                                                }
                                              } catch (err) {
                                                toast({ title: "Erro", description: "Erro de conexão", variant: "destructive" })
                                              }
                                            }}
                                            className="text-xs cursor-pointer hover:bg-muted/50"
                                          >
                                            <Check
                                              className={`mr-2 h-3 w-3 ${tx.categoria === cat.nome ? "opacity-100" : "opacity-0"}`}
                                            />
                                            {cat.nome} <span className="text-[9px] text-muted-foreground ml-1">({cat.tipo === "entrada" ? "Crédito" : "Débito"})</span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>{formatDate(tx.data)}</span>
                              <span>•</span>
                              <span>{tx.conta_nome || "Conta desconhecida"}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`font-bold text-sm ${tx.tipo === "entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {tx.tipo === "entrada" ? "+" : "-"} {formatCurrency(tx.valor)}
                          </div>
                          <Button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-muted focus:ring-0"
                            title="Excluir Transação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma movimentação registrada para este período nesta conta.</p>
                    )}
                  </div>

                  {/* Right Column: Chart & Summary (5 cols) */}
                  <div className="lg:col-span-5 p-4 bg-muted/10 dark:bg-slate-900/10 flex flex-col justify-between max-h-[400px] overflow-y-auto">
                    {pieData.length > 0 ? (
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          📊 Distribuição por Categoria
                        </h5>
                        
                        {/* Resumo Financeiro */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-card/60 border border-border/50 text-[10px]">
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground block font-medium">Saldo Anterior</span>
                            <span className="font-semibold text-foreground block truncate">
                              {formatCurrency(currentPeriodData.saldoAnterior)}
                            </span>
                          </div>
                          <div className="space-y-0.5 border-x border-border/40 px-2">
                            <span className="text-muted-foreground block font-medium">Total Despesas</span>
                            <span className="font-semibold text-red-600 dark:text-red-400 block truncate">
                              {formatCurrency(currentPeriodData.saidas)}
                            </span>
                          </div>
                          <div className="space-y-0.5 pl-1">
                            <span className="text-muted-foreground block font-medium">Saldo Final</span>
                            <span className={`font-semibold block truncate ${currentPeriodData.saldoFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                              {formatCurrency(currentPeriodData.saldoFinal)}
                            </span>
                          </div>
                        </div>

                        <div className="h-44 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: any) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                                itemStyle={{ color: "var(--foreground)" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Summary details */}
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {pieData.map((data, index) => (
                            <div key={data.name} className="flex items-center justify-between text-[11px] py-1 border-b border-border/30 last:border-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-semibold text-foreground truncate">{data.name}</span>
                                <span className="text-[9px] text-muted-foreground">({data.count})</span>
                              </div>
                              <span className={`font-bold ${data.tipo === "entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                {data.tipo === "entrada" ? "+" : "-"} {formatCurrency(data.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground py-8">
                        Sem categorias para exibir gráfico
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Dialog: Confirm Account Creation */}
      <AlertDialog open={showAccConfirm} onOpenChange={setShowAccConfirm}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar Dados da Conta</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 mt-2">
              <span className="block text-sm text-muted-foreground">Deseja confirmar a criação da seguinte conta financeira?</span>
              <span className="block bg-muted/50 p-3 rounded-lg text-xs space-y-1 text-foreground font-medium border border-border">
                <span className="block"><strong>Nome/Banco:</strong> {newAccNome}</span>
                <span className="block"><strong>Tipo:</strong> {getAccountTypeLabel(newAccTipo)}</span>
                <span className="block"><strong>Saldo Inicial:</strong> {formatCurrency(parseFloat(newAccSaldo) || 0)}</span>
                <span className="block"><strong>Data de Referência:</strong> {formatDate(newAccDataSaldo)}</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted text-foreground bg-transparent">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeCreateAccount} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Confirmar e Criar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Account Created Success */}
      <AlertDialog open={showAccSuccess} onOpenChange={setShowAccSuccess}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-600 dark:text-emerald-400">Conta Cadastrada!</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              A conta financeira foi registrada e o saldo inicial foi estabelecido com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAccSuccess(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Import Success Result */}
      <AlertDialog open={importResult !== null} onOpenChange={(open) => { if(!open) setImportResult(null) }}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-indigo-600 dark:text-indigo-400">Importação Concluída!</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 mt-2 text-foreground">
              <span className="block text-sm text-muted-foreground">O arquivo de extrato foi analisado e processado com sucesso:</span>
              <span className="block bg-muted/50 p-3 rounded-lg text-xs space-y-1.5 font-medium border border-border">
                <span className="block">• Total de lançamentos identificados: <strong>{importResult?.total}</strong></span>
                <span className="block">• Novas transações importadas: <strong className="text-emerald-600 dark:text-emerald-400">{importResult?.count}</strong></span>
                {importResult && importResult.total - importResult.count > 0 && (
                  <span className="block text-[10px] text-muted-foreground mt-1">
                    *{importResult.total - importResult.count} lançamentos foram ignorados pois já constavam no banco de dados.
                  </span>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setImportResult(null)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Ok, Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Duplicate Import Alert */}
      <AlertDialog open={duplicateImportAlert !== null} onOpenChange={(open) => { if(!open) setDuplicateImportAlert(null) }}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
              ⚠️ Extrato Já Importado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 mt-2 text-foreground">
              <span className="block text-sm text-muted-foreground">
                Um extrato para esta conta e período já foi importado anteriormente.
              </span>
              <span className="block bg-muted/50 p-3 rounded-lg text-xs space-y-1.5 font-medium text-foreground border border-border">
                <span className="block"><strong>Arquivo importado:</strong> {duplicateImportAlert?.fileName}</span>
                <span className="block"><strong>Data da importação:</strong> {duplicateImportAlert?.createdAt ? new Date(duplicateImportAlert.createdAt).toLocaleString("pt-BR") : ""}</span>
                <span className="block"><strong>Período:</strong> {duplicateImportAlert?.importMonth}/{duplicateImportAlert?.importYear}</span>
              </span>
              <span className="block text-xs text-muted-foreground">
                Importar novamente pode duplicar transações se houver novos registros ou alterações. Deseja prosseguir com a importação mesmo assim?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted text-foreground bg-transparent" onClick={() => setDuplicateImportAlert(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeForceImport} className="bg-amber-600 hover:bg-amber-700 text-white border-0">
              Sim, Importar Novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Centro de Conciliação */}
      <AlertDialog open={showConciliationModal} onOpenChange={setShowConciliationModal}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              📊 Centro de Conciliação & Status de Extratos
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 mt-2">
              <span className="block text-xs text-muted-foreground">
                Selecione o período de referência para verificar quais contas já possuem extratos importados. Você pode realizar a importação diretamente para cada conta pendente nesta tela.
              </span>
              
              {/* Selectors for Month/Year in the modal */}
              <span className="flex gap-4 bg-muted/30 p-3 rounded-lg border border-border">
                <span className="flex-1">
                  <Label htmlFor="conc-month" className="text-[10px] uppercase font-bold text-muted-foreground">Mês de Referência</Label>
                  <Select value={conciliationMonth} onValueChange={conciliationMonth => setConciliationMonth(conciliationMonth)}>
                    <SelectTrigger id="conc-month" className="h-9 mt-1 bg-card text-foreground text-xs">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">Janeiro</SelectItem>
                      <SelectItem value="02">Fevereiro</SelectItem>
                      <SelectItem value="03">Março</SelectItem>
                      <SelectItem value="04">Abril</SelectItem>
                      <SelectItem value="05">Maio</SelectItem>
                      <SelectItem value="06">Junho</SelectItem>
                      <SelectItem value="07">Julho</SelectItem>
                      <SelectItem value="08">Agosto</SelectItem>
                      <SelectItem value="09">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </span>
                <span className="flex-1">
                  <Label htmlFor="conc-year" className="text-[10px] uppercase font-bold text-muted-foreground">Ano de Referência</Label>
                  <Select value={conciliationYear} onValueChange={conciliationYear => setConciliationYear(conciliationYear)}>
                    <SelectTrigger id="conc-year" className="h-9 mt-1 bg-card text-foreground text-xs">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </span>
              </span>

              {/* Accounts list table */}
              <span className="block max-h-[300px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {accounts.filter(acc => acc.tipo !== "aplicacao").map((acc) => {
                  const targetPeriod = `${conciliationYear}-${conciliationMonth.padStart(2, "0")}`
                  const importedList = acc.periodos_importados ? acc.periodos_importados.split(",") : []
                  const isImported = importedList.includes(targetPeriod)
                  
                  return (
                    <span key={acc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-card">
                      <span className="flex items-center gap-2">
                        {getAccountIcon(acc.tipo)}
                        <span className="text-xs font-semibold text-foreground">{acc.nome}</span>
                      </span>

                      <span className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {isImported ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                            <Check className="h-3 w-3" /> Importado
                          </span>
                        ) : (
                          <span className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded">
                              <AlertCircle className="h-3 w-3" /> Pendente
                            </span>
                            
                            {/* File Upload Inline Input */}
                            <span className="flex items-center gap-1">
                              <input
                                type="file"
                                accept=".ofx,.csv"
                                id={`conc-file-${acc.id}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setConciliationFiles(prev => ({ ...prev, [acc.id]: file }))
                                  }
                                }}
                                className="hidden"
                              />
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] cursor-pointer hover:bg-muted border-border text-foreground"
                              >
                                <label htmlFor={`conc-file-${acc.id}`}>
                                  {conciliationFiles[acc.id] ? (
                                    <span className="truncate max-w-[100px] inline-block text-emerald-600 dark:text-emerald-400">
                                      {conciliationFiles[acc.id].name}
                                    </span>
                                  ) : (
                                    "Escolher Extrato"
                                  )}
                                </label>
                              </Button>
                              
                              <Button
                                size="sm"
                                disabled={!conciliationFiles[acc.id] || importing}
                                onClick={() => handleConciliationImport(acc.id)}
                                className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                {importing ? "..." : "Importar"}
                              </Button>
                            </span>
                          </span>
                        )}
                      </span>
                    </span>
                  )
                })}
                {accounts.length === 0 && (
                  <span className="block text-center text-xs text-muted-foreground py-6">
                    Nenhuma conta cadastrada para conciliar.
                  </span>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowConciliationModal(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Fechar Painel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Gerenciar Categorias */}
      <AlertDialog open={showManageCategoriesModal} onOpenChange={setShowManageCategoriesModal}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              🏷️ Gerenciar Categorias Financeiras
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 mt-2">
              <span className="block text-xs text-muted-foreground">
                Cadastre novas categorias ou remova as existentes. Categorias em uso em transações não podem ser excluídas.
              </span>
              
              {/* Adicionar Categoria */}
              <span className="flex gap-2 items-center">
                <Input
                  placeholder="Nome da nova categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
                <Select value={newCategoryType} onValueChange={(val: any) => setNewCategoryType(val)}>
                  <SelectTrigger className="w-28 h-9 text-xs border-border bg-card text-foreground">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Crédito</SelectItem>
                    <SelectItem value="saida">Débito</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddCategory}
                  className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Adicionar
                </Button>
              </span>

              {/* Lista de Categorias */}
              <span className="block max-h-[250px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {categoriesList.map((cat) => (
                  <span key={cat.nome} className="flex items-center justify-between p-2.5 bg-card">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{cat.nome}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cat.tipo === "entrada" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
                        {cat.tipo === "entrada" ? "Crédito" : "Débito"}
                      </span>
                    </span>
                    <Button
                      onClick={() => handleRemoveCategory(cat.nome)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-muted focus:ring-0"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ))}
                {categoriesList.length === 0 && (
                  <span className="block text-center text-xs text-muted-foreground py-6">
                    Nenhuma categoria cadastrada.
                  </span>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowManageCategoriesModal(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
