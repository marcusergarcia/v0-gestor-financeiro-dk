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

    let query = `
      SELECT nf.*, c.nome as cliente_nome, c.codigo as cliente_codigo,
        (SELECT COUNT(*) FROM boletos b WHERE (b.numero_nota = nf.numero_nfse OR b.numero_nota LIKE CONCAT(nf.numero_nfse, '-%')) AND b.asaas_id IS NOT NULL) as boletos_asaas_count,
        (SELECT b.asaas_bankslip_url FROM boletos b WHERE (b.numero_nota = nf.numero_nfse OR b.numero_nota LIKE CONCAT(nf.numero_nfse, '-%')) AND b.asaas_id IS NOT NULL ORDER BY b.id LIMIT 1) as boleto_bankslip_url,
        (SELECT b.asaas_invoice_url FROM boletos b WHERE (b.numero_nota = nf.numero_nfse OR b.numero_nota LIKE CONCAT(nf.numero_nfse, '-%')) AND b.asaas_id IS NOT NULL ORDER BY b.id LIMIT 1) as boleto_invoice_url,
        (SELECT COUNT(*) FROM boletos b WHERE (b.numero_nota = nf.numero_nfse OR b.numero_nota LIKE CONCAT(nf.numero_nfse, '-%'))) as boletos_total_count
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status && status !== "todos") {
      query += " AND nf.status = ?"
      params.push(status)
    }

    if (origem && origem !== "todos") {
      query += " AND nf.origem = ?"
      params.push(origem)
    }

    if (search) {
      query += " AND (nf.numero_nfse LIKE ? OR nf.tomador_razao_social LIKE ? OR c.nome LIKE ? OR nf.numero_rps LIKE ?)"
      const searchLike = `%${search}%`
      params.push(searchLike, searchLike, searchLike, searchLike)
    }

    if (dataInicio) {
      query += " AND nf.created_at >= ?"
      params.push(dataInicio)
    }

    if (dataFim) {
      query += " AND nf.created_at <= ?"
      params.push(dataFim + " 23:59:59")
    }

    query += " ORDER BY nf.created_at DESC LIMIT 500"

    const [rows] = await pool.execute(query, params)

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
