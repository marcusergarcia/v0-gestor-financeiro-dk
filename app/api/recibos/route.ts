import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        r.id,
        r.numero,
        r.cliente_id,
        c.nome as cliente_nome,
        r.valor,
        r.data_emissao,
        r.descricao,
        r.observacoes,
        r.created_at
      FROM recibos r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      WHERE r.ativo = 1
      ORDER BY r.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      data: rows || [],
    })
  } catch (error) {
    console.error("Erro ao buscar recibos:", error)
    return NextResponse.json({
      success: false,
      data: [],
      error: "Erro ao buscar recibos",
    })
  }
}

export async function POST(request: Request) {
  try {
    const { cliente_id, valor, descricao, observacoes } = await request.json()

    if (!cliente_id || !valor || !descricao) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não informados",
        },
        { status: 400 },
      )
    }

    // Gerar próximo número do recibo
    const [lastRecibo] = await pool.execute(`
      SELECT numero FROM recibos ORDER BY id DESC LIMIT 1
    `)

    let proximoNumero = 1
    if (Array.isArray(lastRecibo) && lastRecibo.length > 0) {
      const ultimoNumero = Number.parseInt((lastRecibo[0] as any).numero) || 0
      proximoNumero = ultimoNumero + 1
    }

    const numeroFormatado = proximoNumero.toString().padStart(6, "0")

    const [result] = await pool.execute(
      `
      INSERT INTO recibos (numero, cliente_id, valor, data_emissao, descricao, observacoes, ativo, created_at, updated_at)
      VALUES (?, ?, ?, CURDATE(), ?, ?, 1, NOW(), NOW())
    `,
      [numeroFormatado, cliente_id, valor, descricao, observacoes || ""],
    )

    const insertId = (result as any).insertId

    // Buscar o recibo criado com dados do cliente
    const [newRecibo] = await pool.execute(
      `
      SELECT 
        r.id,
        r.numero,
        r.cliente_id,
        c.nome as cliente_nome,
        r.valor,
        r.data_emissao,
        r.descricao,
        r.observacoes,
        r.created_at
      FROM recibos r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = ?
    `,
      [insertId],
    )

    return NextResponse.json({
      success: true,
      data: (newRecibo as any[])[0],
    })
  } catch (error) {
    console.error("Erro ao criar recibo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar recibo",
      },
      { status: 500 },
    )
  }
}
