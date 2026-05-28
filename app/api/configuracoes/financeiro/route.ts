import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Buscar configurações de visitas técnicas
    const [visitasRows] = await pool.execute(
      "SELECT * FROM visitas_tecnicas_config WHERE ativo = 1 ORDER BY created_at DESC LIMIT 1",
    )

    // Buscar configurações de equipamentos (valor por hora)
    const [equipamentosRows] = await pool.execute("SELECT AVG(valor_hora) as valor_medio_hora FROM equipamentos")

    const visitasConfig = (visitasRows as any[])[0]
    const equipamentosConfig = (equipamentosRows as any[])[0]

    return NextResponse.json({
      success: true,
      data: {
        quantidadeVisitas: visitasConfig?.quantidade_visitas || 1,
        percentualDesconto: Number.parseFloat(visitasConfig?.percentual_desconto) || 0,
        valorMedioHora: Number.parseFloat(equipamentosConfig?.valor_medio_hora) || 0,
        // Valores padrão para campos que não existem nas tabelas atuais
        valorPorKm: 1.5,
        jurosAtraso: 2.0,
        multaAtraso: 10.0,
        descontoAVista: 5.0,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar configurações financeiras:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar configurações financeiras",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { quantidadeVisitas, percentualDesconto, valorMedioHora } = await request.json()

    // Verificar se já existe configuração de visitas técnicas
    const [existing] = await pool.execute("SELECT id FROM visitas_tecnicas_config WHERE ativo = 1 LIMIT 1")

    if (Array.isArray(existing) && existing.length > 0) {
      // Atualizar configuração existente
      await pool.execute(
        `UPDATE visitas_tecnicas_config 
         SET quantidade_visitas = ?, percentual_desconto = ?, updated_at = CURRENT_TIMESTAMP
         WHERE ativo = 1`,
        [quantidadeVisitas, percentualDesconto],
      )
    } else {
      // Criar nova configuração
      await pool.execute(
        `INSERT INTO visitas_tecnicas_config 
         (quantidade_visitas, percentual_desconto, ativo, created_at, updated_at)
         VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [quantidadeVisitas, percentualDesconto],
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configurações financeiras salvas com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao salvar configurações financeiras:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao salvar configurações financeiras",
      },
      { status: 500 },
    )
  }
}
