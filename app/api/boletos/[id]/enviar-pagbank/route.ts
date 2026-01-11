import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function normalizarEstado(estado: string | null | undefined): string {
  if (!estado) return "SP"
  const estadoLimpo = estado.trim().toUpperCase()
  if (estadoLimpo.length === 2) return estadoLimpo

  const mapeamentoEstados: Record<string, string> = {
    ACRE: "AC",
    ALAGOAS: "AL",
    AMAPA: "AP",
    AMAZONAS: "AM",
    BAHIA: "BA",
    CEARA: "CE",
    "DISTRITO FEDERAL": "DF",
    "ESPIRITO SANTO": "ES",
    GOIAS: "GO",
    MARANHAO: "MA",
    "MATO GROSSO": "MT",
    "MATO GROSSO DO SUL": "MS",
    "MINAS GERAIS": "MG",
    PARA: "PA",
    PARAIBA: "PB",
    PARANA: "PR",
    PERNAMBUCO: "PE",
    PIAUI: "PI",
    "RIO DE JANEIRO": "RJ",
    "RIO GRANDE DO NORTE": "RN",
    "RIO GRANDE DO SUL": "RS",
    RONDONIA: "RO",
    RORAIMA: "RR",
    "SANTA CATARINA": "SC",
    "SAO PAULO": "SP",
    SERGIPE: "SE",
    TOCANTINS: "TO",
  }

  return mapeamentoEstados[estadoLimpo] || "SP"
}

function obterNomeEstado(uf: string): string {
  const mapeamentoUF: Record<string, string> = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapá",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Ceará",
    DF: "Distrito Federal",
    ES: "Espírito Santo",
    GO: "Goiás",
    MA: "Maranhão",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Pará",
    PB: "Paraíba",
    PR: "Paraná",
    PE: "Pernambuco",
    PI: "Piauí",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondônia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "São Paulo",
    SE: "Sergipe",
    TO: "Tocantins",
  }
  return mapeamentoUF[uf] || "São Paulo"
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"

    console.log("[v0] Enviando boleto para PagBank:", id, "Force:", force)

    // Buscar boleto com dados do cliente
    const boletos = await query(
      `
      SELECT 
        b.*,
        c.nome as cliente_nome,
        c.email as cliente_email,
        c.cpf,
        c.cnpj,
        c.telefone,
        c.endereco,
        c.bairro,
        c.cidade,
        c.estado,
        c.cep
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
      WHERE b.id = ?
    `,
      [id],
    )

    if (boletos.length === 0) {
      return NextResponse.json({ success: false, message: "Boleto não encontrado" }, { status: 404 })
    }

    const boleto = boletos[0]

    if (boleto.charge_id && !force) {
      return NextResponse.json(
        {
          success: false,
          message: "Este boleto já foi enviado ao PagBank",
        },
        { status: 400 },
      )
    }

    const pagseguroToken = process.env.PAGSEGURO_TOKEN
    if (!pagseguroToken || pagseguroToken === "test_token_temporario") {
      return NextResponse.json(
        {
          success: false,
          message: "PagBank não configurado",
        },
        { status: 400 },
      )
    }

    // Enviar ao PagBank
    const { getPagSeguroAPI } = await import("@/lib/pagseguro")
    const pagseguro = getPagSeguroAPI()

    const ufNormalizada = normalizarEstado(boleto.estado)
    const nomeEstado = obterNomeEstado(ufNormalizada)

    const telefoneLimpo = (boleto.telefone || "11999999999").replace(/\D/g, "")
    const telefoneCompleto = telefoneLimpo.length >= 10 ? telefoneLimpo : "11999999999"

    const taxId = (boleto.cnpj || boleto.cpf || "").replace(/\D/g, "")
    const taxIdValido = taxId.length >= 11 ? taxId : "00000000000"
    const emailValido =
      boleto.cliente_email && boleto.cliente_email.includes("@")
        ? boleto.cliente_email
        : `cliente${boleto.cliente_id}@sistema.com`
    const cepValido = (boleto.cep || "").replace(/\D/g, "")
    const cepCompleto = cepValido.length === 8 ? cepValido : "01310100"

    const enderecoValido = typeof boleto.endereco === "string" ? boleto.endereco.substring(0, 160) : "Rua Principal"
    const bairroValido = typeof boleto.bairro === "string" ? boleto.bairro.substring(0, 60) : "Centro"
    const cidadeValida = typeof boleto.cidade === "string" ? boleto.cidade.substring(0, 90) : "São Paulo"
    const numeroEndereco = "S/N"

    const valorMinimo = 0.2
    const valorBoleto = boleto.valor < valorMinimo ? valorMinimo : boleto.valor

    const descricaoBoleto = boleto.descricao_produto || `Boleto ${boleto.numero}`

    const dueDateFormatted = new Date(boleto.data_vencimento).toISOString().split("T")[0]

    const payload = {
      reference_id: boleto.numero,
      customer: {
        name: boleto.cliente_nome,
        email: emailValido,
        tax_id: taxIdValido,
        phones: [
          {
            country: "55",
            area: telefoneCompleto.substring(0, 2),
            number: telefoneCompleto.substring(2),
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
          reference_id: boleto.numero,
          name:
            typeof descricaoBoleto === "string" && descricaoBoleto.length > 0
              ? descricaoBoleto.substring(0, 100)
              : `Boleto ${boleto.numero}`.substring(0, 100),
          quantity: 1,
          unit_amount: Math.round(valorBoleto * 100),
        },
      ],
      charges: [
        {
          reference_id: boleto.numero,
          description:
            typeof descricaoBoleto === "string" && descricaoBoleto.length > 0
              ? descricaoBoleto.substring(0, 64)
              : `Boleto ${boleto.numero}`.substring(0, 64),
          amount: {
            value: Math.round(valorBoleto * 100),
            currency: "BRL",
          },
          payment_method: {
            type: "BOLETO",
            boleto: {
              template: "COBRANCA",
              due_date: dueDateFormatted,
              days_until_expiration: 30,
              instruction_lines: {
                line_1: "Pagamento ate o vencimento",
                line_2: "Apos vencimento cobrar multa e juros",
              },
              holder: {
                name: boleto.cliente_nome,
                tax_id: taxIdValido,
                email: emailValido,
                address: {
                  street: enderecoValido,
                  number: numeroEndereco,
                  postal_code: cepCompleto,
                  locality: bairroValido,
                  city: cidadeValida,
                  region: nomeEstado,
                  region_code: ufNormalizada,
                  country: "BRA",
                },
              },
            },
          },
        },
      ],
      notification_urls: ["https://gestor9.vercel.app/api/pagbank/webhook"],
    }

    console.log("[v0] Enviando ao PagBank:", JSON.stringify(payload, null, 2))

    const boletoPagSeguro = await pagseguro.criarBoleto(payload)

    console.log("[v0] Boleto criado no PagBank:", boletoPagSeguro.id)

    const orderId = boletoPagSeguro.id // ORDE_XXXX
    const charge = boletoPagSeguro?.charges?.[0]
    const chargeId = charge?.id // CHAR_XXXX
    const boletoInfo = charge?.payment_method?.boleto
    const linkPDF = charge?.links?.find((l: any) => l.media === "application/pdf")?.href
    const linkPNG = charge?.links?.find((l: any) => l.media === "image/png")?.href

    await query(
      `
      UPDATE boletos 
      SET 
        order_id = ?,
        charge_id = ?,
        linha_digitavel = ?,
        codigo_barras = ?,
        link_pdf = ?,
        link_impressao = ?,
        notification_urls = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        orderId || null,
        chargeId || null,
        boletoInfo?.formatted_barcode || null,
        boletoInfo?.barcode || null,
        linkPDF || null,
        linkPNG || null,
        "https://gestor9.vercel.app/api/pagbank/webhook",
        id,
      ],
    )

    console.log("[v0] Boleto atualizado no banco com order_id e charge_id")

    return NextResponse.json({
      success: true,
      message: "Boleto enviado ao PagBank com sucesso!",
      data: {
        order_id: orderId,
        charge_id: chargeId,
        linha_digitavel: boletoInfo?.formatted_barcode,
        codigo_barras: boletoInfo?.barcode,
        link_pdf: linkPDF,
        link_impressao: linkPNG,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao enviar boleto para PagBank:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao enviar boleto para PagBank",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
