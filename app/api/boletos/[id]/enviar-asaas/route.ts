import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAsaasAPI } from "@/lib/asaas"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("[Asaas] Enviando boleto para Asaas:", id)

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
        c.cep,
        c.asaas_id as cliente_asaas_id
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
      WHERE b.id = ?
    `,
      [id]
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
        { status: 400 }
      )
    }

    // Verificar API Key do Asaas
    const asaasApiKey = process.env.ASAAS_API_KEY
    if (!asaasApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Asaas não configurado. Configure ASAAS_API_KEY nas variáveis de ambiente.",
        },
        { status: 400 }
      )
    }

    const asaas = getAsaasAPI()

    // Preparar dados do cliente
    const cpfCnpj = (boleto.cnpj || boleto.cpf || "").replace(/\D/g, "")
    if (!cpfCnpj || cpfCnpj.length < 11) {
      return NextResponse.json(
        {
          success: false,
          message: "CPF/CNPJ do cliente é obrigatório e deve ser válido",
        },
        { status: 400 }
      )
    }

    const telefoneLimpo = (boleto.telefone || "").replace(/\D/g, "")
    const emailValido =
      boleto.cliente_email && boleto.cliente_email.includes("@")
        ? boleto.cliente_email
        : undefined

    // Buscar ou criar cliente no Asaas
    let clienteAsaasId = boleto.cliente_asaas_id

    if (!clienteAsaasId) {
      console.log("[Asaas] Buscando/criando cliente no Asaas...")
      
      const clienteAsaas = await asaas.buscarOuCriarCliente({
        name: boleto.cliente_nome,
        email: emailValido,
        cpfCnpj: cpfCnpj,
        mobilePhone: telefoneLimpo || undefined,
        address: boleto.endereco || undefined,
        addressNumber: "S/N",
        province: boleto.bairro || undefined,
        postalCode: (boleto.cep || "").replace(/\D/g, "") || undefined,
        city: boleto.cidade || undefined,
        state: boleto.estado || undefined,
      })

      clienteAsaasId = clienteAsaas.id

      // Salvar ID do cliente no banco
      await query(`UPDATE clientes SET asaas_id = ? WHERE id = ?`, [clienteAsaasId, boleto.cliente_id])
      console.log("[Asaas] Cliente salvo no banco:", clienteAsaasId)
    }

    // Formatar descrição do boleto
    const dataNotaFormatada = boleto.data_nota
      ? new Date(boleto.data_nota).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      : ""

    const descricaoBoleto =
      boleto.numero_nota && boleto.numero_parcela && boleto.total_parcelas
        ? `NOTA FISCAL No ${boleto.numero_nota} - ${dataNotaFormatada} - Parcela ${boleto.numero_parcela}/${boleto.total_parcelas}`
        : boleto.descricao_produto || `Boleto ${boleto.numero}`

    // Formatar data de vencimento
    const dueDateFormatted = new Date(boleto.data_vencimento).toISOString().split("T")[0]

    // Criar boleto no Asaas
    console.log("[Asaas] Criando boleto no Asaas...")
    
    const boletoAsaas = await asaas.criarBoleto({
      customer: clienteAsaasId,
      billingType: "BOLETO",
      value: boleto.valor,
      dueDate: dueDateFormatted,
      description: descricaoBoleto.substring(0, 500),
      externalReference: boleto.numero,
      fine: {
        value: 2, // 2% de multa
        type: "PERCENTAGE",
      },
      interest: {
        value: 1, // 1% ao mês de juros
        type: "PERCENTAGE",
      },
    })

    console.log("[Asaas] Boleto criado:", boletoAsaas.id)

    // Buscar linha digitável
    let linhaDigitavel = boletoAsaas.identificationField || ""
    let codigoBarras = boletoAsaas.barCode || ""

    if (!linhaDigitavel && boletoAsaas.id) {
      try {
        const dadosBoleto = await asaas.obterLinhaDigitavel(boletoAsaas.id)
        linhaDigitavel = dadosBoleto.identificationField || ""
        codigoBarras = dadosBoleto.barCode || ""
      } catch (e) {
        console.log("[Asaas] Não foi possível obter linha digitável:", e)
      }
    }

    // Atualizar boleto no banco
    await query(
      `
      UPDATE boletos 
      SET 
        asaas_id = ?,
        asaas_customer_id = ?,
        asaas_invoice_url = ?,
        asaas_bankslip_url = ?,
        asaas_barcode = ?,
        asaas_linha_digitavel = ?,
        asaas_nosso_numero = ?,
        gateway = 'asaas',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        boletoAsaas.id,
        clienteAsaasId,
        boletoAsaas.invoiceUrl || null,
        boletoAsaas.bankSlipUrl || null,
        codigoBarras || null,
        linhaDigitavel || null,
        boletoAsaas.nossoNumero || null,
        id,
      ]
    )

    console.log("[Asaas] Boleto atualizado no banco com asaas_id:", boletoAsaas.id)

    return NextResponse.json({
      success: true,
      message: "Boleto enviado ao Asaas com sucesso!",
      data: {
        asaas_id: boletoAsaas.id,
        invoice_url: boletoAsaas.invoiceUrl,
        bankslip_url: boletoAsaas.bankSlipUrl,
        linha_digitavel: linhaDigitavel,
        codigo_barras: codigoBarras,
        nosso_numero: boletoAsaas.nossoNumero,
      },
    })
  } catch (error) {
    console.error("[Asaas] Erro ao enviar boleto:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao enviar boleto para Asaas",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
