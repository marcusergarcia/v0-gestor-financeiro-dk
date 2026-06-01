import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // 1. Fetch Unpaid Boletos for future projections
    const [boletos]: any = await pool.execute(`
      SELECT data_vencimento as data, valor, status 
      FROM boletos 
      WHERE status IN ('pendente', 'aguardando_pagamento') AND data_vencimento IS NOT NULL
    `)

    // 2. Fetch Active Recibos (Receipts)
    const [recibos]: any = await pool.execute(`
      SELECT data_emissao as data, valor 
      FROM recibos 
      WHERE ativo = 1
    `)

    // 3. Fetch Financial Transactions (Statements) joined with Account info
    const [transacoesOriginal]: any = await pool.execute(`
      SELECT t.id, t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id, c.tipo as conta_tipo
      FROM transacoes_financeiras t
      JOIN contas_financeiras c ON t.conta_id = c.id
      WHERE t.ativo = 1
    `)

    // Deduplicate identical transactions (same date, value, type, description) across different accounts
    const transacoes: any[] = []
    const seenTx = new Set()
    for (const t of transacoesOriginal) {
      let dStr = "0000-00-00"
      if (t.data) {
        try {
          const parsed = t.data instanceof Date ? t.data : new Date(t.data)
          if (!isNaN(parsed.getTime())) {
            dStr = parsed.toISOString().split("T")[0]
          }
        } catch {}
      }
      const valStr = parseFloat(t.valor || 0).toFixed(2)
      const key = `${dStr}_${valStr}_${t.tipo}_${t.descricao || ""}`
      if (!seenTx.has(key)) {
        seenTx.add(key)
        transacoes.push(t)
      }
    }

    const hoje = new Date()
    const currentMonthKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`

    // Grouping by Month (YYYY-MM)
    const monthlyData: Record<string, { mes: string; entradas: number; saidas: number; saldo: number; rendimentos: number; entradasProjetadas: number; saidasProjetadas: number }> = {}

    const getMonthKey = (dateString: string | Date): string => {
      try {
        const d = new Date(dateString)
        if (isNaN(d.getTime())) return "Outros"
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
      } catch {
        return "Outros"
      }
    }

    const initMonth = (month: string) => {
      if (!monthlyData[month]) {
        // Month name formatter (ex: "Mai/2026")
        let label = month
        if (month !== "Outros") {
          const [year, m] = month.split("-")
          const date = new Date(parseInt(year), parseInt(m) - 1, 1)
          label = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
          // Capitalize first letter
          label = label.replace(/^\w/, (c) => c.toUpperCase()).replace(".", "")
        }
        monthlyData[month] = { 
          mes: label, 
          entradas: 0, 
          saidas: 0, 
          saldo: 0, 
          rendimentos: 0,
          entradasProjetadas: 0,
          saidasProjetadas: 0
        }
      }
    }

    // 4. Match and ignore internal transfers (same day, same value, opposite types, different accounts)
    const transferIdsToIgnore = new Set<number>()
    const pairs: Record<string, any[]> = {}
    
    for (const t of transacoes) {
      let dateKey = "0000-00-00"
      if (t.data) {
        try {
          const d = t.data instanceof Date ? t.data : new Date(t.data)
          if (!isNaN(d.getTime())) {
            dateKey = d.toISOString().split("T")[0]
          }
        } catch (err) {}
      }
      const valueKey = parseFloat(t.valor).toFixed(2)
      const key = `${dateKey}_${valueKey}`
      if (!pairs[key]) pairs[key] = []
      pairs[key].push(t)
    }

    for (const key in pairs) {
      const list = pairs[key]
      if (list.length >= 2) {
        const entradas = list.filter((x) => x.tipo === "entrada")
        const saidas = list.filter((x) => x.tipo === "saida")
        const matchCount = Math.min(entradas.length, saidas.length)
        for (let i = 0; i < matchCount; i++) {
          transferIdsToIgnore.add(entradas[i].id)
          transferIdsToIgnore.add(saidas[i].id)
        }
      }
    }

    // Add manual / imported transactions (either inflow or outflow)
    // This is our primary source of truth for actual cash flow
    for (const t of transacoes) {
      // 1. Skip internal transfers
      if (transferIdsToIgnore.has(t.id)) {
        continue
      }

      const month = getMonthKey(t.data)
      initMonth(month)
      const val = parseFloat(t.valor) || 0

      const txDate = t.data instanceof Date ? t.data : new Date(t.data)
      const isFutura = !isNaN(txDate.getTime()) && txDate > hoje

      // If it is an investment account (aplicacao) or credit card (cartao_credito), only present as statistics/details, not in main cash flow totals
      if (t.conta_tipo === "aplicacao" || t.conta_tipo === "cartao_credito") {
        if (t.conta_tipo === "aplicacao" && t.tipo === "entrada") {
          const desc = t.descricao?.toLowerCase() || ""
          // Sum up yields/interest
          if (desc.match(/(rendimento|juros|renda|yield|rend)/)) {
            monthlyData[month].rendimentos += val
          }
        }
        // Count credit card future expenses as projected/future expenses!
        if (t.conta_tipo === "cartao_credito" && t.tipo === "saida" && isFutura) {
          monthlyData[month].saidasProjetadas += val
        }
        continue
      }

      if (t.tipo === "entrada") {
        if (isFutura) {
          monthlyData[month].entradasProjetadas += val
        } else {
          monthlyData[month].entradas += val
        }
      } else {
        if (isFutura) {
          monthlyData[month].saidasProjetadas += val
        } else {
          monthlyData[month].saidas += val
        }
      }
    }

    // Add unpaid boletos (only for current/future projections to avoid double counting actual payments)
    for (const b of boletos) {
      const month = getMonthKey(b.data)
      // Only include boletos as projection if their due date is in the current or future months
      if (month >= currentMonthKey && month !== "Outros") {
        initMonth(month)
        monthlyData[month].entradasProjetadas += parseFloat(b.valor) || 0
      }
    }

    // Add recibos only if they are for current/future months or not matched
    // To be consistent and safe, we can add recibos for current/future months
    for (const r of recibos) {
      const month = getMonthKey(r.data)
      if (month >= currentMonthKey && month !== "Outros") {
        initMonth(month)
        monthlyData[month].entradasProjetadas += parseFloat(r.valor) || 0
      }
    }

    // Calculate balances and sort months chronologically
    const sortedMonths = Object.keys(monthlyData)
      .filter((m) => m !== "Outros")
      .sort()

    const result = sortedMonths.map((m) => {
      const data = monthlyData[m]
      data.saldo = (data.entradas + data.entradasProjetadas) - (data.saidas + data.saidasProjetadas)
      return {
        ...data,
        periodo: m
      }
    })

    // Add "Outros" at the end if it exists
    if (monthlyData["Outros"]) {
      const data = monthlyData["Outros"]
      data.saldo = (data.entradas + data.entradasProjetadas) - (data.saidas + data.saidasProjetadas)
      result.push({
        ...data,
        periodo: "Outros"
      })
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error("Erro ao gerar fluxo de caixa:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
