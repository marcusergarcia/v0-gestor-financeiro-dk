import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [rows] = await pool.execute(
      `
      SELECT 
        p.*,
        tp.nome as categoria_nome,
        tp.codigo as categoria_codigo,
        tp.id as categoria_id,
        m.nome as marca_nome,
        m.sigla as marca_sigla,
        m.id as marca_id
      FROM produtos p
      LEFT JOIN tipos_produtos tp ON p.tipo = tp.nome
      LEFT JOIN marcas m ON p.marca = m.nome
      WHERE p.id = ?
      `,
      [id],
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 })
    }

    const produto = (rows as any[])[0]

    return NextResponse.json({
      success: true,
      data: {
        id: produto.id,
        codigo: produto.codigo,
        descricao: produto.descricao,
        tipo: produto.tipo, // Nome da categoria
        marca: produto.marca, // Nome da marca
        categoria_nome: produto.categoria_nome,
        categoria_id: produto.categoria_id,
        marca_nome: produto.marca_nome,
        marca_id: produto.marca_id,
        ncm: produto.ncm,
        unidade: produto.unidade,
        valor_custo: Number.parseFloat(produto.valor_custo || 0),
        valor_unitario: Number.parseFloat(produto.valor_unitario || 0),
        valor_mao_obra: Number.parseFloat(produto.valor_mao_obra || 0),
        margem_lucro: Number.parseFloat(produto.margem_lucro || 0),
        estoque: Number.parseFloat(produto.estoque || 0),
        estoque_minimo: Number.parseFloat(produto.estoque_minimo || 0),
        observacoes: produto.observacoes,
        ativo: Boolean(produto.ativo),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar produto" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    console.log("Dados recebidos para atualização:", data)

    // Validar se o produto existe
    const [existingRows] = await pool.execute("SELECT id FROM produtos WHERE id = ?", [id])

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 })
    }

    // Função para tratar valores que podem ser undefined, null ou NaN
    const sanitizeValue = (value: any, defaultValue: any = null) => {
      if (value === undefined || value === null) {
        return defaultValue
      }
      if (typeof value === "string" && value.trim() === "") {
        return defaultValue
      }
      // Se for string "NaN", manter como string
      if (value === "NaN") {
        return "NaN"
      }
      return value
    }

    // Sanitizar todos os valores antes de usar no SQL
    const sanitizedData = {
      descricao: sanitizeValue(data.descricao, ""),
      tipo: sanitizeValue(data.tipo, null),
      marca: sanitizeValue(data.marca, null),
      ncm: sanitizeValue(data.ncm, null),
      unidade: sanitizeValue(data.unidade, "UN"),
      valor_custo: Number.parseFloat(sanitizeValue(data.valor_custo, 0)) || 0,
      valor_unitario: Number.parseFloat(sanitizeValue(data.valor_unitario, 0)) || 0,
      valor_mao_obra: Number.parseFloat(sanitizeValue(data.valor_mao_obra, 0)) || 0,
      margem_lucro: Number.parseFloat(sanitizeValue(data.margem_lucro, 0)) || 0,
      estoque: Number.parseFloat(sanitizeValue(data.estoque, 0)) || 0,
      estoque_minimo: Number.parseFloat(sanitizeValue(data.estoque_minimo, 0)) || 0,
      observacoes: sanitizeValue(data.observacoes, ""),
      ativo: Boolean(data.ativo),
    }

    console.log("Dados sanitizados:", sanitizedData)

    // Atualizar produto usando os campos corretos tipo e marca
    await pool.execute(
      `
      UPDATE produtos SET
        descricao = ?,
        tipo = ?,
        marca = ?,
        ncm = ?,
        unidade = ?,
        valor_custo = ?,
        valor_unitario = ?,
        valor_mao_obra = ?,
        margem_lucro = ?,
        estoque = ?,
        estoque_minimo = ?,
        observacoes = ?,
        ativo = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        sanitizedData.descricao,
        sanitizedData.tipo,
        sanitizedData.marca,
        sanitizedData.ncm,
        sanitizedData.unidade,
        sanitizedData.valor_custo,
        sanitizedData.valor_unitario,
        sanitizedData.valor_mao_obra,
        sanitizedData.margem_lucro,
        sanitizedData.estoque,
        sanitizedData.estoque_minimo,
        sanitizedData.observacoes,
        sanitizedData.ativo ? 1 : 0,
        id,
      ],
    )

    console.log("Produto atualizado com sucesso:", id)

    return NextResponse.json({
      success: true,
      message: "Produto atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar se o produto existe
    const [existingRows] = await pool.execute("SELECT id, codigo, descricao, estoque FROM produtos WHERE id = ?", [id])

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 })
    }

    const produto = (existingRows as any[])[0]

    // Verificar se o estoque está zerado
    if (produto.estoque > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Não é possível excluir o produto. Estoque atual: ${produto.estoque} unidades. Zere o estoque primeiro.`,
        },
        { status: 400 },
      )
    }

    // Verificar se o produto está sendo usado em orçamentos (testando diferentes possibilidades de coluna)
    let orcamentoRows: any[] = []
    let orcamentosEncontrados: string[] = []

    try {
      // Tentar com descricao (mais provável baseado na estrutura)
      const [rows1] = await pool.execute(
        `SELECT DISTINCT o.numero 
         FROM orcamentos_itens oi 
         JOIN orcamentos o ON oi.orcamento_numero = o.numero 
         WHERE oi.descricao = ?`,
        [produto.descricao],
      )
      orcamentoRows = rows1 as any[]
      orcamentosEncontrados = orcamentoRows.map((row) => row.numero)
    } catch (error1) {
      try {
        // Tentar com codigo do produto
        const [rows2] = await pool.execute(
          `SELECT DISTINCT o.numero 
           FROM orcamentos_itens oi 
           JOIN orcamentos o ON oi.orcamento_numero = o.numero 
           WHERE oi.codigo = ?`,
          [produto.codigo],
        )
        orcamentoRows = rows2 as any[]
        orcamentosEncontrados = orcamentoRows.map((row) => row.numero)
      } catch (error2) {
        // Se não conseguir encontrar por nenhum campo, assumir que não está em uso
        console.log("Não foi possível verificar uso em orçamentos, assumindo que não está em uso")
        orcamentoRows = []
      }
    }

    if (orcamentosEncontrados.length > 0) {
      const numerosOrcamentos = orcamentosEncontrados.join(", ")
      return NextResponse.json(
        {
          success: false,
          message: `Este produto está associado ao(s) orçamento(s): ${numerosOrcamentos}. Exclua primeiro do(s) orçamento(s), depois zere o estoque e exclua o produto.`,
        },
        { status: 400 },
      )
    }

    // Verificar se o produto está sendo usado em propostas
    let propostaRows: any[] = []
    let propostasEncontradas: string[] = []

    try {
      // Tentar com descricao
      const [rows1] = await pool.execute(
        `SELECT DISTINCT pc.numero 
         FROM proposta_itens pi 
         JOIN proposta_contratos pc ON pi.proposta_numero = pc.numero 
         WHERE pi.descricao = ?`,
        [produto.descricao],
      )
      propostaRows = rows1 as any[]
      propostasEncontradas = propostaRows.map((row) => row.numero)
    } catch (error1) {
      try {
        // Tentar com codigo
        const [rows2] = await pool.execute(
          `SELECT DISTINCT pc.numero 
           FROM proposta_itens pi 
           JOIN proposta_contratos pc ON pi.proposta_numero = pc.numero 
           WHERE pi.codigo = ?`,
          [produto.codigo],
        )
        propostaRows = rows2 as any[]
        propostasEncontradas = propostaRows.map((row) => row.numero)
      } catch (error2) {
        console.log("Não foi possível verificar uso em propostas, assumindo que não está em uso")
        propostaRows = []
      }
    }

    if (propostasEncontradas.length > 0) {
      const numerosPropostas = propostasEncontradas.join(", ")
      return NextResponse.json(
        {
          success: false,
          message: `Este produto está associado à(s) proposta(s): ${numerosPropostas}. Exclua primeiro da(s) proposta(s), depois zere o estoque e exclua o produto.`,
        },
        { status: 400 },
      )
    }

    // Agora pode excluir definitivamente já que estoque está zerado e não está em uso
    await pool.execute("DELETE FROM produtos WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Produto excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json({ success: false, message: "Erro ao excluir produto" }, { status: 500 })
  }
}
