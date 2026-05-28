import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoria_id, marca_nome, categoria, marca } = body

    const marcaNome = marca_nome || marca

    // ----------------------------------------------------------------
    // Buscar o campo `codigo` da categoria (ex: '012' para INFORMATICA)
    // Esse `codigo` é o prefixo usado no código do produto.
    // Suporta busca por nome (formato novo) ou por id (formato legado).
    // ----------------------------------------------------------------
    let codigoCategoria: string | null = null

    if (categoria) {
      // Formato novo: busca pelo nome da categoria
      const [categoriaRows] = await pool.execute(
        "SELECT codigo, nome FROM tipos_produtos WHERE nome = ?",
        [categoria]
      )
      if (Array.isArray(categoriaRows) && categoriaRows.length > 0) {
        codigoCategoria = (categoriaRows[0] as any).codigo || null
      }
    } else if (categoria_id) {
      // Formato legado: busca pelo id (suporta tanto INT quanto UUID)
      const [categoriaRows] = await pool.execute(
        "SELECT codigo FROM tipos_produtos WHERE id = ?",
        [categoria_id]
      )
      if (Array.isArray(categoriaRows) && categoriaRows.length > 0) {
        codigoCategoria = (categoriaRows[0] as any).codigo || null
      }
    }

    if (!codigoCategoria) {
      return NextResponse.json(
        {
          success: false,
          message: "Categoria não encontrada. Verifique se a categoria está cadastrada corretamente.",
        },
        { status: 400 },
      )
    }

    let codigoGerado = ""

    // Verificar se é categoria de serviços (código 015 ou nome SERVICOS/SERV)
    const isServico =
      codigoCategoria === "015" ||
      codigoCategoria.toLowerCase() === "serv" ||
      codigoCategoria.toLowerCase() === "servicos"

    if (isServico) {
      // Para serviços: SERV + sequência (ex: SERV001, SERV002...)
      let contador = 1
      let codigoTentativa = ""

      do {
        codigoTentativa = `SERV${contador.toString().padStart(3, "0")}`

        const [existeRows] = await pool.execute("SELECT id FROM produtos WHERE codigo = ?", [codigoTentativa])

        if (!Array.isArray(existeRows) || existeRows.length === 0) {
          codigoGerado = codigoTentativa
          break
        }

        contador++
      } while (contador <= 9999)

      if (!codigoGerado) {
        return NextResponse.json(
          {
            success: false,
            message: "Não foi possível gerar código único para serviço",
          },
          { status: 500 },
        )
      }
    } else {
      // Para produtos normais: {codigoCategoria}{siglaMarca}{contador}
      // Exemplo: 012ITB169 = INFORMATICA + INTELBRAS + sequência 169
      if (!marcaNome || marcaNome === "Nenhuma marca") {
        return NextResponse.json(
          {
            success: false,
            message: "Marca é obrigatória para produtos",
          },
          { status: 400 },
        )
      }

      // Buscar sigla e contador da marca
      const [marcaRows] = await pool.execute(
        "SELECT id, sigla, contador FROM marcas WHERE nome = ?",
        [marcaNome]
      )

      if (!Array.isArray(marcaRows) || marcaRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Marca "${marcaNome}" não encontrada no cadastro`,
          },
          { status: 404 },
        )
      }

      const marca_data = marcaRows[0] as any
      const siglaMarca = marca_data.sigla || "GEN"
      const marcaId = marca_data.id
      let contador = (marca_data.contador || 0) + 1

      // Transação para garantir que o contador não seja duplicado
      const connection = await pool.getConnection()

      try {
        await connection.beginTransaction()

        // Gerar código: codigoCategoria + siglaMarca + sequência
        const codigoBase = `${codigoCategoria}${siglaMarca}`
        let codigoTentativa = ""

        do {
          codigoTentativa = `${codigoBase}${contador.toString().padStart(3, "0")}`

          const [existeRows] = await connection.execute(
            "SELECT id FROM produtos WHERE codigo = ?",
            [codigoTentativa]
          )

          if (!Array.isArray(existeRows) || existeRows.length === 0) {
            codigoGerado = codigoTentativa
            break
          }

          contador++
        } while (contador <= 9999)

        if (!codigoGerado) {
          await connection.rollback()
          return NextResponse.json(
            {
              success: false,
              message: "Não foi possível gerar código único",
            },
            { status: 500 },
          )
        }

        // Atualizar contador da marca
        await connection.execute("UPDATE marcas SET contador = ? WHERE id = ?", [contador, marcaId])

        await connection.commit()
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        codigo: codigoGerado,
        codigo_categoria: codigoCategoria,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar código:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
