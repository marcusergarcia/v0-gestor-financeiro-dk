"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarCustom } from "@/components/calendar-custom"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, Clock, User, MapPin, AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import type { OrdemServico } from "@/types/ordem-servico"
import { useLogos } from "@/hooks/use-logos"

type PeriodFilter = "all" | "manha" | "tarde" | "integral"

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true)
  const [ordensAgendadas, setOrdensAgendadas] = useState<OrdemServico[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [ordensDoDay, setOrdensDoDay] = useState<OrdemServico[]>([])
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
  const { logos, loading: logosLoading } = useLogos()

  useEffect(() => {
    carregarOrdensAgendadas()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      filtrarOrdensDoDia(selectedDate)
    }
  }, [selectedDate, ordensAgendadas, periodFilter])

  const carregarOrdensAgendadas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/ordens-servico?situacao=agendada&limit=1000")
      const data = await response.json()

      if (data.success) {
        setOrdensAgendadas(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar ordens agendadas:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarOrdensDoDia = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    let ordens = ordensAgendadas.filter((os) => {
      if (!os.data_agendamento) return false
      const osDate = os.data_agendamento.split("T")[0]
      return osDate === dateString
    })

    if (periodFilter === "manha") {
      ordens = ordens.filter((os) => os.periodo_agendamento === "manha")
    } else if (periodFilter === "tarde") {
      ordens = ordens.filter((os) => os.periodo_agendamento === "tarde")
    } else if (periodFilter === "integral") {
      ordens = ordens.filter((os) => os.periodo_agendamento === "integral")
    }

    setOrdensDoDay(ordens)
  }

  const getDatesWithOrders = () => {
    return ordensAgendadas
      .filter((os) => os.data_agendamento)
      .map((os) => new Date(os.data_agendamento!.split("T")[0] + "T12:00:00"))
  }

  const getDatesWithPeriods = () => {
    const periodsMap = new Map<string, { manha: boolean; tarde: boolean; integral: boolean }>()

    ordensAgendadas
      .filter((os) => os.data_agendamento)
      .forEach((os) => {
        const dateKey = os.data_agendamento!.split("T")[0]
        const existing = periodsMap.get(dateKey) || { manha: false, tarde: false, integral: false }

        if (os.periodo_agendamento === "manha") {
          existing.manha = true
        } else if (os.periodo_agendamento === "tarde") {
          existing.tarde = true
        } else if (os.periodo_agendamento === "integral") {
          existing.integral = true
        }

        periodsMap.set(dateKey, existing)
      })

    return Array.from(periodsMap.entries()).map(([dateStr, periods]) => ({
      date: new Date(dateStr + "T12:00:00"),
      ...periods,
    }))
  }

  const getPeriodoLabel = (periodo?: string) => {
    if (periodo === "manha") return "Manhã"
    if (periodo === "tarde") return "Tarde"
    if (periodo === "integral") return "Integral"
    return "Não especificado"
  }

  const getPeriodoBadgeColor = (periodo?: string) => {
    if (periodo === "manha") return "bg-blue-100 text-blue-800 border-blue-300"
    if (periodo === "tarde") return "bg-orange-100 text-orange-800 border-orange-300"
    if (periodo === "integral") return "bg-green-100 text-green-800 border-green-300"
    return "bg-gray-100 text-gray-800"
  }

  const handlePeriodFilterClick = (filter: PeriodFilter) => {
    setPeriodFilter(filter === periodFilter ? "all" : filter)
  }

  const datesWithOrders = getDatesWithOrders()
  const datesWithPeriods = getDatesWithPeriods()

  const totalManha = ordensAgendadas.filter((os) => os.periodo_agendamento === "manha").length
  const totalTarde = ordensAgendadas.filter((os) => os.periodo_agendamento === "tarde").length
  const totalIntegral = ordensAgendadas.filter((os) => os.periodo_agendamento === "integral").length

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {logos.menu && (
          <img src={logos.menu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
        )}
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Calendário de Agendamentos
          </h2>
          <p className="text-sm text-muted-foreground">Visualize e gerencie ordens de serviço agendadas</p>
        </div>
      </div>

      {/* Stats Cards - Made cards clickable for filtering */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 cursor-pointer transition-all hover:shadow-md"
          onClick={() => setPeriodFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700">Total Agendadas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-800">{ordensAgendadas.length}</div>
            <p className="text-xs text-cyan-600">ordens agendadas</p>
            {periodFilter === "all" && <Badge className="mt-2 bg-cyan-600 text-white">Filtro ativo</Badge>}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer transition-all hover:shadow-md ${
            periodFilter === "manha" ? "ring-2 ring-blue-600" : ""
          }`}
          onClick={() => handlePeriodFilterClick("manha")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Manhã</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{totalManha}</div>
            <p className="text-xs text-blue-600">período da manhã (9h-12h)</p>
            {periodFilter === "manha" && <Badge className="mt-2 bg-blue-600 text-white">Filtro ativo</Badge>}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer transition-all hover:shadow-md ${
            periodFilter === "tarde" ? "ring-2 ring-orange-600" : ""
          }`}
          onClick={() => handlePeriodFilterClick("tarde")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Tarde</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{totalTarde}</div>
            <p className="text-xs text-orange-600">período da tarde (13h-17h)</p>
            {periodFilter === "tarde" && <Badge className="mt-2 bg-orange-600 text-white">Filtro ativo</Badge>}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer transition-all hover:shadow-md ${
            periodFilter === "integral" ? "ring-2 ring-green-600" : ""
          }`}
          onClick={() => handlePeriodFilterClick("integral")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Integral</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{totalIntegral}</div>
            <p className="text-xs text-green-600">período integral (9h-17h)</p>
            {periodFilter === "integral" && <Badge className="mt-2 bg-green-600 text-white">Filtro ativo</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg py-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">Calendário</CardTitle>
                <CardDescription className="text-cyan-100 text-xs">
                  Selecione uma data para ver as ordens
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CalendarCustom
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              highlightedDates={getDatesWithOrders()}
              datesWithPeriods={getDatesWithPeriods()}
              className="rounded-md border shadow-sm"
            />
            <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-300 rounded"></div>
                <span>Dias com agendamentos</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <div className="w-5 h-5 border-2 border-red-500 rounded"></div>
                <span>Dia selecionado</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                <div className="w-5 h-5 bg-orange-50 border-2 border-orange-400 rounded flex items-center justify-center">
                  <span className="text-[6px] font-bold">Hoje</span>
                </div>
                <span>Dia atual</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <div className="w-3 h-3 bg-blue-600 border border-blue-800 rounded-full shadow-sm"></div>
                <span>Manhã (9h-12h)</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                <div className="w-3 h-3 bg-orange-600 border border-orange-800 rounded-full shadow-sm"></div>
                <span>Tarde (13h-17h)</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <div className="w-3 h-3 bg-green-600 border border-green-800 rounded-full shadow-sm"></div>
                <span>Integral (9h-17h)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders of Selected Day - Updated to show period badges */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">
                    Ordens do Dia - {selectedDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-xs">
                    {ordensDoDay.length} ordem(ns) agendada(s)
                    {periodFilter !== "all" && ` - ${getPeriodoLabel(periodFilter)}`}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {ordensDoDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma ordem agendada</p>
                <p className="text-sm text-gray-400 mt-1">
                  {periodFilter !== "all"
                    ? `Nenhuma ordem para este período (${getPeriodoLabel(periodFilter)}). Clique nos cards acima para mudar o filtro.`
                    : "Selecione outro dia no calendário"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ordensDoDay.map((os) => (
                  <Card key={os.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-blue-600">OS {os.numero}</span>
                            {os.periodo_agendamento && (
                              <Badge className={`${getPeriodoBadgeColor(os.periodo_agendamento)} border`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {getPeriodoLabel(os.periodo_agendamento)}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {os.data_agendamento
                              ? new Date(os.data_agendamento.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                              : "Não informada"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{os.cliente_nome}</span>
                        </div>
                        {os.cliente_endereco && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 text-xs">{os.cliente_endereco}</span>
                          </div>
                        )}
                        {os.tecnico_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 text-xs">Técnico: {os.tecnico_name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        <Link href={`/ordem-servico/${os.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full bg-blue-50 hover:bg-blue-100">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                        </Link>
                        <Link href={`/ordem-servico/${os.id}/editar`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full bg-green-50 hover:bg-green-100">
                            Executar
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
