import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

// Consultar cashback de um cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const telefone = searchParams.get("telefone")

    if (!clienteId && !telefone) {
      return NextResponse.json({ success: false, message: "Cliente ID ou telefone é obrigatório" }, { status: 400 })
    }

    let query = `
      SELECT 
        c.*,
        cl.nome as cliente_nome,
        b.numero as boleto_numero
      FROM cashback c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN boletos b ON c.boleto_id = b.id
      WHERE 1=1
    `
    const params: any[] = []

    if (clienteId) {
      query += " AND c.cliente_id = ?"
      params.push(clienteId)
    }

    if (telefone) {
      query += " AND c.telefone = ?"
      params.push(telefone)
    }

    query += " ORDER BY c.created_at DESC"

    const [cashbacks] = await pool.execute(query, params)

    // Buscar saldo total disponível
    const [saldo] = await pool.execute(
      `
      SELECT 
        COALESCE(SUM(valor_cashback), 0) as saldo_total
      FROM cashback
      WHERE status = 'concedido'
      ${clienteId ? "AND cliente_id = ?" : ""}
      ${telefone ? "AND telefone = ?" : ""}
    `,
      params,
    )

    return NextResponse.json({
      success: true,
      data: {
        cashbacks,
        saldo_disponivel: (saldo as any[])[0].saldo_total,
      },
    })
  } catch (error) {
    console.error("[Cashback] Erro ao consultar:", error)
    return NextResponse.json({ success: false, message: "Erro ao consultar cashback" }, { status: 500 })
  }
}

// Resgatar cashback
export async function POST(request: NextRequest) {
  try {
    const { clienteId, telefone, valor } = await request.json()

    if (!telefone || !valor) {
      return NextResponse.json({ success: false, message: "Telefone e valor são obrigatórios" }, { status: 400 })
    }

    // Verificar saldo disponível
    const [saldo] = await pool.execute(
      `
      SELECT COALESCE(SUM(valor_cashback), 0) as saldo_total
      FROM cashback
      WHERE status = 'concedido' AND telefone = ?
    `,
      [telefone],
    )

    const saldoDisponivel = (saldo as any[])[0].saldo_total

    if (saldoDisponivel < valor) {
      return NextResponse.json({ success: false, message: "Saldo insuficiente" }, { status: 400 })
    }

    // Resgatar no ClubePag do PagSeguro
    try {
      const { getPagSeguroAPI } = await import("@/lib/pagseguro")
      const pagseguro = getPagSeguroAPI()
      await pagseguro.resgatarCashback(telefone, Math.round(valor * 100))
    } catch (error) {
      console.error("[Cashback] Erro ao resgatar no ClubePag:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao resgatar cashback no PagSeguro",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
        { status: 500 },
      )
    }

    // Atualizar cashbacks no banco (FIFO - primeiro a entrar, primeiro a sair)
    let valorRestante = valor

    const [cashbacks] = await pool.execute(
      `
      SELECT * FROM cashback
      WHERE status = 'concedido' AND telefone = ?
      ORDER BY data_concessao ASC
    `,
      [telefone],
    )

    for (const cashback of cashbacks as any[]) {
      if (valorRestante <= 0) break

      const valorResgate = Math.min(cashback.valor_cashback, valorRestante)

      await pool.execute(
        `
        UPDATE cashback
        SET 
          status = 'resgatado',
          data_resgate = CURRENT_TIMESTAMP,
          observacoes = CONCAT(COALESCE(observacoes, ''), ' | Resgatado: R$ ', ?)
        WHERE id = ?
      `,
        [valorResgate.toFixed(2), cashback.id],
      )

      valorRestante -= valorResgate
    }

    return NextResponse.json({
      success: true,
      message: "Cashback resgatado com sucesso",
      data: { valor_resgatado: valor },
    })
  } catch (error) {
    console.error("[Cashback] Erro ao resgatar:", error)
    return NextResponse.json({ success: false, message: "Erro ao resgatar cashback" }, { status: 500 })
  }
}
