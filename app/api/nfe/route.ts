import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        ne.*,
        c.nome as cliente_nome
      FROM nfe_emitidas ne
      LEFT JOIN clientes c ON ne.cliente_id = c.id
      ORDER BY ne.created_at DESC
      LIMIT 200`
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    console.error("Erro ao buscar NF-e emitidas:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
