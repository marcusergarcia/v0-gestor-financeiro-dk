import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoria_id, marca_nome, categoria, marca } = body

    // Suporte para ambos os formatos (novo e antigo)
    let categoriaId = categoria_id
    const marcaNome = marca_nome || marca

    // Se não tiver categoria_id, buscar pelo nome da categoria
    if (!categoriaId && categoria) {
      const [categoriaRows] = await pool.execute("SELECT id, codigo FROM tipos_produtos WHERE nome = ?", [categoria])

      if (Array.isArray(categoriaRows) && categoriaRows.length > 0) {
        const cat = categoriaRows[0] as any
        categoriaId = cat.id
      }
    }

    if (!categoriaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Categoria é obrigatória",
        },
        { status: 400 },
      )
    }

    // Buscar informações da categoria
    const [categoriaRows] = await pool.execute("SELECT codigo FROM tipos_produtos WHERE id = ?", [categoriaId])

    if (!Array.isArray(categoriaRows) || categoriaRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Categoria não encontrada",
        },
        { status: 404 },
      )
    }

    const categoria_data = categoriaRows[0] as any
    const codigoCategoria = categoria_data.codigo || "PROD"

    let codigoGerado = ""

    // Verificar se é categoria de serviços
    const isServico = codigoCategoria.toLowerCase() === "serv" || codigoCategoria.toLowerCase() === "servicos"

    if (isServico) {
      // Para serviços, usar apenas SERV + sequência
      let contador = 1
      let codigoTentativa = ""

      do {
        codigoTentativa = `SERV${contador.toString().padStart(3, "0")}`

        // Verificar se código já existe
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
      // Para produtos normais, usar categoria + marca + contador
      if (!marcaNome || marcaNome === "Nenhuma marca") {
        return NextResponse.json(
          {
            success: false,
            message: "Marca é obrigatória para produtos",
          },
          { status: 400 },
        )
      }

      // Buscar informações da marca
      const [marcaRows] = await pool.execute("SELECT id, sigla, contador FROM marcas WHERE nome = ?", [marcaNome])

      if (!Array.isArray(marcaRows) || marcaRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Marca não encontrada",
          },
          { status: 404 },
        )
      }

      const marca_data = marcaRows[0] as any
      const siglaMarca = marca_data.sigla || "GEN"
      const marcaId = marca_data.id
      let contador = (marca_data.contador || 0) + 1

      // Usar transação para garantir atomicidade
      const connection = await pool.getConnection()

      try {
        await connection.beginTransaction()

        // Gerar código base
        const codigoBase = `${codigoCategoria}${siglaMarca}`
        let codigoTentativa = ""

        // Tentar gerar código único
        do {
          codigoTentativa = `${codigoBase}${contador.toString().padStart(3, "0")}`

          // Verificar se código já existe
          const [existeRows] = await connection.execute("SELECT id FROM produtos WHERE codigo = ?", [codigoTentativa])

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
      data: { codigo: codigoGerado },
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
