import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAsaasAPI } from "@/lib/asaas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Buscar boleto com dados do cliente
    const boletos = await query(
      `
      SELECT 
        b.*,
        c.id as cliente_db_id,
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

    // Verificar se já foi enviado ao Asaas
    if (boleto.asaas_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Este boleto já foi enviado ao Asaas",
        },
        { status: 400 },
      )
    }

    // Verificar API Key
    const asaasApiKey = process.env.ASAAS_API_KEY
    
    if (!asaasApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Asaas não configurado. Configure a variável ASAAS_API_KEY.",
        },
        { status: 400 },
      )
    }

    const asaas = getAsaasAPI()

    // Preparar dados do cliente
    const cpfCnpj = (boleto.cnpj || boleto.cpf || "").replace(/\D/g, "")
    
    if (!cpfCnpj || cpfCnpj.length < 11) {
      return NextResponse.json(
        {
          success: false,
          message: "CPF/CNPJ do cliente é obrigatório para emitir boleto no Asaas",
        },
        { status: 400 },
      )
    }

    const telefone = (boleto.telefone || "").replace(/\D/g, "")
    const cep = (boleto.cep || "").replace(/\D/g, "")

    // PASSO 1: Criar ou buscar cliente no Asaas
    let cliente
    try {
      cliente = await asaas.obterOuCriarCliente({
        name: boleto.cliente_nome,
        cpfCnpj: cpfCnpj,
        email: boleto.cliente_email || undefined,
        mobilePhone: telefone.length >= 10 ? telefone : undefined,
        address: boleto.endereco || undefined,
        addressNumber: "S/N",
        province: boleto.bairro || undefined,
        postalCode: cep.length === 8 ? cep : undefined,
        externalReference: String(boleto.cliente_db_id),
      })
    } catch (clienteError: any) {
      console.error("Erro ao obter/criar cliente no Asaas:", clienteError.message)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao criar cliente no Asaas: ${clienteError.message}`,
        },
        { status: 500 },
      )
    }

    // PASSO 2: Formatar dados da cobrança
    const dataVencimento = new Date(boleto.data_vencimento).toISOString().split("T")[0]

    // Montar descrição
    const dataNotaFormatada = boleto.data_nota
      ? new Date(boleto.data_nota).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      : ""

    const descricao =
      boleto.numero_nota && boleto.numero_parcela && boleto.total_parcelas
        ? `NOTA FISCAL No ${boleto.numero_nota} - ${dataNotaFormatada} - Parcela ${boleto.numero_parcela}/${boleto.total_parcelas}`
        : `Boleto ${boleto.numero}`

    // PASSO 3: Criar cobrança no Asaas
    let cobranca
    try {
      cobranca = await asaas.criarCobranca({
        customer: cliente.id,
        billingType: "BOLETO",
        value: Number(boleto.valor),
        dueDate: dataVencimento,
        description: descricao.substring(0, 500),
        externalReference: boleto.numero,
        fine: {
          value: 2,
          type: "PERCENTAGE",
        },
        interest: {
          value: 1,
          type: "PERCENTAGE",
        },
      })
    } catch (cobrancaError: any) {
      console.error("Erro ao criar cobrança no Asaas:", cobrancaError.message)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao criar cobrança no Asaas: ${cobrancaError.message}`,
        },
        { status: 500 },
      )
    }

    // PASSO 4: Atualizar boleto no banco (incluindo mudança de status para aguardando_pagamento)
    await query(
      `
      UPDATE boletos 
      SET 
        asaas_id = ?,
        asaas_customer_id = ?,
        asaas_invoice_url = ?,
        asaas_bankslip_url = ?,
        asaas_linha_digitavel = ?,
        asaas_barcode = ?,
        asaas_nosso_numero = ?,
        gateway = 'asaas',
        status = 'aguardando_pagamento',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        cobranca.id,
        cliente.id,
        cobranca.invoiceUrl || null,
        cobranca.bankSlipUrl || null,
        cobranca.identificationField || null,
        cobranca.barCode || null,
        cobranca.nossoNumero || null,
        id,
      ],
    )

    return NextResponse.json({
      success: true,
      message: "Boleto enviado ao Asaas com sucesso!",
      data: {
        asaas_id: cobranca.id,
        customer_id: cliente.id,
        invoice_url: cobranca.invoiceUrl,
        bank_slip_url: cobranca.bankSlipUrl,
        linha_digitavel: cobranca.identificationField,
        codigo_barras: cobranca.barCode,
        nosso_numero: cobranca.nossoNumero,
      },
    })
  } catch (error) {
    console.error("Erro ao enviar boleto para Asaas:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao enviar boleto para Asaas",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
