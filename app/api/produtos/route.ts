import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const categoria = searchParams.get("categoria") || ""

    let query = `
      SELECT 
        p.id,
        p.codigo,
        p.descricao,
        p.tipo,
        p.marca,
        p.ncm,
        p.unidade,
        p.valor_unitario,
        p.valor_mao_obra,
        p.valor_custo,
        p.margem_lucro,
        p.estoque,
        p.estoque_minimo,
        p.observacoes,
        p.ativo,
        tp.nome as categoria_nome,
        tp.codigo as categoria_codigo,
        m.nome as marca_nome,
        m.sigla as marca_sigla
      FROM produtos p
      LEFT JOIN tipos_produtos tp ON p.tipo = tp.nome
      LEFT JOIN marcas m ON p.marca = m.nome
      WHERE 1=1
    `

    const params: any[] = []

    // Filtro por categoria específica
    if (categoria) {
      query += ` AND LOWER(p.tipo) = LOWER(?)`
      params.push(categoria)
    }

    if (search) {
      query += ` AND (p.codigo LIKE ? OR p.descricao LIKE ? OR p.tipo LIKE ? OR p.marca LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    query += ` ORDER BY p.codigo LIMIT ?`
    params.push(limit)

    const [rows] = await pool.execute(query, params)

    const produtos = (rows as any[]).map((row: any) => ({
      id: row.id.toString(),
      codigo: row.codigo,
      descricao: row.descricao,
      tipo: row.tipo,
      marca: row.marca,
      categoria_nome: row.categoria_nome || row.tipo,
      categoria_codigo: row.categoria_codigo,
      marca_nome: row.marca_nome || row.marca,
      marca_sigla: row.marca_sigla,
      ncm: row.ncm,
      unidade: row.unidade,
      valor_unitario: Number.parseFloat(row.valor_unitario) || 0,
      valor_mao_obra: Number.parseFloat(row.valor_mao_obra) || 0,
      valor_custo: Number.parseFloat(row.valor_custo) || 0,
      margem_lucro: Number.parseFloat(row.margem_lucro) || 0,
      estoque: Number.parseFloat(row.estoque) || 0,
      estoque_minimo: Number.parseFloat(row.estoque_minimo) || 0,
      observacoes: row.observacoes,
      ativo: Boolean(row.ativo),
    }))

    return NextResponse.json({
      success: true,
      data: produtos,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      codigo, // Agora recebemos o código já gerado
      descricao,
      tipo,
      marca,
      ncm,
      unidade = "UN",
      valor_unitario = 0,
      valor_mao_obra = 180,
      valor_custo = 0,
      margem_lucro = 30,
      estoque = 0,
      estoque_minimo = 1,
      observacoes,
      ativo = true,
    } = body

    // Validações
    if (!descricao || descricao.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Descrição é obrigatória",
        },
        { status: 400 },
      )
    }

    if (!tipo || tipo.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Tipo/Categoria é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se é serviço
    const isServico = tipo?.toLowerCase() === "serviços" || tipo?.toLowerCase() === "servicos"

    // Validação de marca apenas para produtos (não serviços)
    if (!isServico && (!marca || marca.trim() === "" || marca === "Nenhuma marca")) {
      return NextResponse.json(
        {
          success: false,
          message: "Marca é obrigatória para produtos",
        },
        { status: 400 },
      )
    }

    let codigoFinal = codigo

    // Se não foi fornecido código, gerar automaticamente
    if (!codigoFinal) {
      try {
        if (isServico) {
          // Para serviços, usar código 015 + numeração sequencial
          const [servicoRows] = await pool.execute(
            `SELECT codigo FROM produtos 
             WHERE codigo LIKE '015%' 
             ORDER BY CAST(SUBSTRING(codigo, 4) AS UNSIGNED) DESC 
             LIMIT 1`,
          )

          let proximoNumero = 1
          if (Array.isArray(servicoRows) && servicoRows.length > 0) {
            const ultimoCodigo = (servicoRows[0] as any).codigo
            const numeroAtual = Number.parseInt(ultimoCodigo.substring(3), 10)
            if (!isNaN(numeroAtual)) {
              proximoNumero = numeroAtual + 1
            }
          }

          codigoFinal = `015${proximoNumero.toString().padStart(3, "0")}`
        } else {
          // Para produtos, usar categoria + marca
          if (!marca || marca.trim() === "") {
            return NextResponse.json(
              {
                success: false,
                message: "Marca é obrigatória para produtos",
              },
              { status: 400 },
            )
          }

          // Buscar informações da categoria e marca
          const [categoriaRows] = await pool.execute("SELECT codigo FROM tipos_produtos WHERE nome = ?", [tipo])
          const [marcaRows] = await pool.execute("SELECT sigla FROM marcas WHERE nome = ?", [marca])

          const codigoCategoria =
            Array.isArray(categoriaRows) && categoriaRows.length > 0
              ? (categoriaRows[0] as any).codigo || "PROD"
              : "PROD"

          const siglaMarca =
            Array.isArray(marcaRows) && marcaRows.length > 0 ? (marcaRows[0] as any).sigla || "GEN" : "GEN"

          // Gerar código único
          let contador = 1
          let codigoTentativa = ""

          do {
            codigoTentativa = `${codigoCategoria}${siglaMarca}${contador.toString().padStart(3, "0")}`
            const [existeRows] = await pool.execute("SELECT id FROM produtos WHERE codigo = ?", [codigoTentativa])

            if (!Array.isArray(existeRows) || existeRows.length === 0) {
              codigoFinal = codigoTentativa
              break
            }
            contador++
          } while (contador <= 9999)
        }
      } catch (generateError) {
        console.warn("Erro ao gerar código automaticamente, usando fallback:", generateError)
        // Fallback: código simples com timestamp
        const timestamp = Date.now().toString().slice(-4)
        codigoFinal = `PROD${timestamp}`
      }
    }

    // Se ainda não temos código, gerar um simples
    if (!codigoFinal) {
      const timestamp = Date.now().toString().slice(-4)
      codigoFinal = `PROD${timestamp}`
    }

    // Verificar se o código já existe (dupla verificação)
    const [existing] = await pool.execute("SELECT id FROM produtos WHERE codigo = ?", [codigoFinal])
    if (Array.isArray(existing) && existing.length > 0) {
      // Se já existe, adicionar timestamp para tornar único
      const timestamp = Date.now().toString().slice(-3)
      codigoFinal = `${codigoFinal}${timestamp}`
    }

    console.log("Código final a ser salvo:", codigoFinal)

    // Preparar valores para inserção (tratar undefined/null)
    const valores = [
      codigoFinal,
      descricao.trim(),
      tipo.trim(),
      marca ? marca.trim() : null,
      ncm ? ncm.trim() : null,
      unidade || "UN",
      Number(valor_unitario) || 0,
      Number(valor_mao_obra) || 180,
      Number(valor_custo) || 0,
      Number(margem_lucro) || 30,
      Number(estoque) || 0,
      Number(estoque_minimo) || 1,
      observacoes ? observacoes.trim() : null,
      ativo ? 1 : 0,
    ]

    const [result] = await pool.execute(
      `INSERT INTO produtos (
        codigo, descricao, tipo, marca, ncm, unidade,
        valor_unitario, valor_mao_obra, valor_custo, margem_lucro,
        estoque, estoque_minimo, observacoes, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      valores,
    )

    console.log("Produto salvo com código:", codigoFinal)

    return NextResponse.json({
      success: true,
      data: {
        id: (result as any).insertId,
        codigo: codigoFinal,
        descricao: descricao.trim(),
        tipo: tipo.trim(),
        marca: marca ? marca.trim() : null,
        ncm: ncm ? ncm.trim() : null,
        unidade: unidade || "UN",
        valor_unitario: Number(valor_unitario) || 0,
        valor_mao_obra: Number(valor_mao_obra) || 180,
        valor_custo: Number(valor_custo) || 0,
        margem_lucro: Number(margem_lucro) || 30,
        estoque: Number(estoque) || 0,
        estoque_minimo: Number(estoque_minimo) || 1,
        observacoes: observacoes ? observacoes.trim() : null,
        ativo: Boolean(ativo),
      },
      message: "Produto criado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao criar produto:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
