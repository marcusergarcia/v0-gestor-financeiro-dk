import { type NextRequest, NextResponse } from "next/server"
import { getAsaasAPI } from "@/lib/asaas"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const descricao = searchParams.get("descricao") || undefined

    const asaas = getAsaasAPI()
    const result = await asaas.listarServicosMunicipais(descricao)

    return NextResponse.json({
      success: true,
      data: result.data || [],
    })
  } catch (error) {
    console.error("Erro ao listar servicos municipais:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao listar servicos municipais",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
