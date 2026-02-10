import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const origem = searchParams.get("origem")
    const search = searchParams.get("search")
    const dataInicio = searchParams.get("data_inicio")
    const dataFim = searchParams.get("data_fim")

    // Montar filtros
    const params: any[] = []
    let filters = ""

    if (status && status !== "todos") {
      filters += " AND nf.status = ?"
      params.push(status)
    }

    if (origem && origem !== "todos") {
      filters += " AND nf.origem = ?"
      params.push(origem)
    }

    if (search) {
      filters += " AND (nf.numero_nfse LIKE ? OR nf.tomador_razao_social LIKE ? OR c.nome LIKE ? OR nf.numero_rps LIKE ?)"
      const searchLike = `%${search}%`
      params.push(searchLike, searchLike, searchLike, searchLike)
    }

    if (dataInicio) {
      filters += " AND nf.created_at >= ?"
      params.push(dataInicio)
    }

    if (dataFim) {
      filters += " AND nf.created_at <= ?"
      params.push(dataFim + " 23:59:59")
    }

    const orderLimit = " ORDER BY nf.created_at DESC LIMIT 500"

    let rows: any
    try {
      // Tentar com subqueries de boletos (pode falhar se colunas nao existirem)
      const queryWithBoletos = `
        SELECT nf.*, c.nome as cliente_nome, c.codigo as cliente_codigo,
          (SELECT COUNT(*) FROM boletos b WHERE (b.numero_nota = nf.numero_nfse OR b.numero_nota LIKE CONCAT(nf.numero_nfse, '-%')) AND b.asaas_id IS NOT NULL) as boletos_asaas_count,
          (SELECT COUNT(*) FROM boletos b WHERE (b.numero_nota = nf.numero_nfse OR b.numero_nota LIKE CONCAT(nf.numero_nfse, '-%'))) as boletos_total_count
        FROM notas_fiscais nf
        LEFT JOIN clientes c ON nf.cliente_id = c.id
        WHERE 1=1 ${filters} ${orderLimit}
      `;
      [rows] = await pool.execute(queryWithBoletos, params)
    } catch (subqueryError) {
      console.error("Subquery de boletos falhou, buscando sem info de boletos:", subqueryError)
      // Fallback sem subqueries de boletos
      const querySimple = `
        SELECT nf.*, c.nome as cliente_nome, c.codigo as cliente_codigo,
          0 as boletos_asaas_count, 0 as boletos_total_count
        FROM notas_fiscais nf
        LEFT JOIN clientes c ON nf.cliente_id = c.id
        WHERE 1=1 ${filters} ${orderLimit}
      `;
      [rows] = await pool.execute(querySimple, params)
    }

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (error: any) {
    console.error("Erro ao buscar notas fiscais:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao buscar notas: " + error.message },
      { status: 500 },
    )
  }
}
