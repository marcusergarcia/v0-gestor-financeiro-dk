import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, codigo, nome, descricao, ativo, created_at, updated_at 
      FROM tipos_produtos 
      WHERE ativo = 1 
      ORDER BY nome ASC
    `)

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codigo, nome, descricao, ativo } = await request.json()

    if (!nome) {
      return NextResponse.json({ success: false, message: "Nome é obrigatório" }, { status: 400 })
    }

    let codigoFinal = codigo

    // Se código não foi fornecido, gerar automaticamente
    if (!codigoFinal) {
      // Buscar o maior código numérico atual
      const [maxCodigoRows] = await pool.execute(`
        SELECT codigo FROM tipos_produtos 
        WHERE codigo REGEXP '^[0-9]+$' 
        ORDER BY CAST(codigo AS UNSIGNED) DESC 
        LIMIT 1
      `)

      let proximoCodigo = 1
      if (Array.isArray(maxCodigoRows) && maxCodigoRows.length > 0) {
        const maxCodigo = (maxCodigoRows[0] as any).codigo
        proximoCodigo = parseInt(maxCodigo, 10) + 1
      }

      // Formatar com 3 dígitos (ex: 001, 020, 100)
      codigoFinal = proximoCodigo.toString().padStart(3, "0")
    }

    // Verificar se código já existe
    const [existingRows] = await pool.execute("SELECT id FROM tipos_produtos WHERE codigo = ?", [codigoFinal])

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json({ success: false, message: "Código já existe" }, { status: 400 })
    }

    // Inserir nova categoria
    const ativoValue = ativo === undefined ? 1 : (ativo ? 1 : 0)
    const [result] = await pool.execute(
      "INSERT INTO tipos_produtos (codigo, nome, descricao, ativo) VALUES (?, ?, ?, ?)",
      [codigoFinal, nome, descricao || null, ativoValue],
    )

    const insertResult = result as any

    return NextResponse.json({
      success: true,
      data: {
        id: insertResult.insertId,
        codigo: codigoFinal,
        nome,
        descricao,
        ativo: ativoValue === 1,
      },
    })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
