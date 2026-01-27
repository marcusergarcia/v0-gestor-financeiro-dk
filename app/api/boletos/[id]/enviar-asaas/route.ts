import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAsaasAPI } from "@/lib/asaas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Enviando boleto para Asaas - ID:", id)

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
      console.log("[v0] Boleto não encontrado:", id)
      return NextResponse.json({ success: false, message: "Boleto não encontrado" }, { status: 404 })
    }

    const boleto = boletos[0]
    console.log("[v0] Boleto encontrado:", boleto.numero, "- Cliente:", boleto.cliente_nome)

    // Verificar se já foi enviado ao Asaas
    if (boleto.asaas_id) {
      console.log("[v0] Boleto já enviado ao Asaas:", boleto.asaas_id)
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
    const asaasEnv = process.env.ASAAS_ENVIRONMENT || "production"
    console.log("[v0] Asaas Environment:", asaasEnv)
    console.log("[v0] Asaas API Key exists:", !!asaasApiKey)
    
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
    console.log("[v0] CPF/CNPJ do cliente:", cpfCnpj)
    
    if (!cpfCnpj || cpfCnpj.length < 11) {
      console.log("[v0] CPF/CNPJ inválido")
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
    console.log("[v0] PASSO 1: Obtendo/criando cliente no Asaas...")
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
      console.log("[v0] Cliente obtido/criado com sucesso:", cliente.id)
    } catch (clienteError: any) {
      console.error("[v0] Erro ao obter/criar cliente:", clienteError.message)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao criar cliente no Asaas: ${clienteError.message}`,
        },
        { status: 500 },
      )
    }

    // PASSO 2: Formatar dados da cobrança
    console.log("[v0] PASSO 2: Preparando dados da cobrança...")
    const dataVencimento = new Date(boleto.data_vencimento).toISOString().split("T")[0]
    console.log("[v0] Data vencimento:", dataVencimento)

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
        : boleto.descricao_produto || `Boleto ${boleto.numero}`
    
    console.log("[v0] Descrição:", descricao)
    console.log("[v0] Valor:", boleto.valor)

    // PASSO 3: Criar cobrança no Asaas
    console.log("[v0] PASSO 3: Criando cobrança no Asaas...")
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
      console.log("[v0] Cobrança criada com sucesso:", cobranca.id)
    } catch (cobrancaError: any) {
      console.error("[v0] Erro ao criar cobrança:", cobrancaError.message)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao criar cobrança no Asaas: ${cobrancaError.message}`,
        },
        { status: 500 },
      )
    }

    // PASSO 4: Atualizar boleto no banco
    console.log("[v0] PASSO 4: Atualizando boleto no banco de dados...")
    await query(
      `
      UPDATE boletos 
      SET 
        asaas_id = ?,
        asaas_customer_id = ?,
        asaas_url = ?,
        asaas_bank_slip_url = ?,
        linha_digitavel = ?,
        codigo_barras = ?,
        gateway = 'asaas',
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
        id,
      ],
    )

    console.log("[v0] Boleto atualizado com sucesso!")

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
    console.error("[v0] Erro geral ao enviar boleto:", error)
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
