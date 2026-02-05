import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAsaasAPI } from "@/lib/asaas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Buscar nota fiscal com dados do cliente
    const notas = await query(
      `
      SELECT 
        nf.*,
        c.nome as cliente_nome,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        c.bairro as cliente_bairro,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado,
        c.cep as cliente_cep
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
      WHERE nf.id = ?
    `,
      [id]
    )

    if (notas.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nota fiscal nao encontrada" },
        { status: 404 }
      )
    }

    const nota = (notas as any[])[0]

    // Verificar se ja foi emitida
    if (nota.asaas_id && nota.status !== "rascunho" && nota.status !== "erro") {
      return NextResponse.json(
        { success: false, message: "Esta nota fiscal ja foi enviada ao Asaas" },
        { status: 400 }
      )
    }

    const asaas = getAsaasAPI()

    // Obter ou criar cliente no Asaas
    const cpfCnpj = (nota.cliente_cnpj || nota.cliente_cpf || "").replace(/\D/g, "")
    if (!cpfCnpj || cpfCnpj.length < 11) {
      return NextResponse.json(
        { success: false, message: "CPF/CNPJ do cliente e obrigatorio para emitir NFS-e" },
        { status: 400 }
      )
    }

    const telefone = (nota.cliente_telefone || "").replace(/\D/g, "")
    const cep = (nota.cliente_cep || "").replace(/\D/g, "")

    let cliente
    try {
      cliente = await asaas.obterOuCriarCliente({
        name: nota.cliente_nome,
        cpfCnpj: cpfCnpj,
        email: nota.cliente_email || undefined,
        mobilePhone: telefone.length >= 10 ? telefone : undefined,
        address: nota.cliente_endereco || undefined,
        addressNumber: "S/N",
        province: nota.cliente_bairro || undefined,
        postalCode: cep.length === 8 ? cep : undefined,
        externalReference: String(nota.cliente_id),
      })
    } catch (clienteError: any) {
      return NextResponse.json(
        { success: false, message: `Erro ao criar cliente no Asaas: ${clienteError.message}` },
        { status: 500 }
      )
    }

    // Montar payload da NFS-e para o Asaas
    const invoicePayload: any = {
      customer: cliente.id,
      serviceDescription: nota.descricao_servico,
      observations: nota.observacoes || "",
      value: Number(nota.valor),
      deductions: Number(nota.deducoes) || 0,
      effectiveDate: nota.data_emissao || new Date().toISOString().split("T")[0],
      taxes: {
        retainIss: nota.reter_iss === 1,
        iss: Number(nota.iss_percentual) || 0,
        cofins: Number(nota.cofins_percentual) || 0,
        csll: Number(nota.csll_percentual) || 0,
        inss: Number(nota.inss_percentual) || 0,
        ir: Number(nota.ir_percentual) || 0,
        pis: Number(nota.pis_percentual) || 0,
      },
    }

    // Adicionar servico municipal
    if (nota.municipal_service_id) {
      invoicePayload.municipalServiceId = nota.municipal_service_id
      invoicePayload.municipalServiceCode = null
    } else if (nota.municipal_service_code) {
      invoicePayload.municipalServiceId = null
      invoicePayload.municipalServiceCode = nota.municipal_service_code
    }

    if (nota.municipal_service_name) {
      invoicePayload.municipalServiceName = nota.municipal_service_name
    }

    // Se existe boleto vinculado com asaas_id, vincular ao payment
    if (nota.boleto_id) {
      const boletos = await query(
        `SELECT asaas_id FROM boletos WHERE id = ? AND asaas_id IS NOT NULL`,
        [nota.boleto_id]
      )
      if ((boletos as any[]).length > 0) {
        invoicePayload.payment = (boletos as any[])[0].asaas_id
      }
    }

    // Emitir NFS-e no Asaas
    let invoice
    try {
      invoice = await asaas.agendarNotaFiscal(invoicePayload)
    } catch (invoiceError: any) {
      // Atualizar status para erro
      await query(
        `UPDATE notas_fiscais SET status = 'erro', asaas_error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [invoiceError.message, id]
      )
      return NextResponse.json(
        { success: false, message: `Erro ao emitir NFS-e no Asaas: ${invoiceError.message}` },
        { status: 500 }
      )
    }

    // Atualizar nota fiscal no banco com dados do Asaas
    await query(
      `
      UPDATE notas_fiscais SET
        asaas_id = ?,
        asaas_customer_id = ?,
        asaas_status = ?,
        asaas_numero = ?,
        asaas_pdf_url = ?,
        asaas_xml_url = ?,
        asaas_rps_number = ?,
        asaas_error_message = NULL,
        status = 'agendada',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        invoice.id,
        cliente.id,
        invoice.status || "SCHEDULED",
        invoice.number || null,
        invoice.pdfUrl || null,
        invoice.xmlUrl || null,
        invoice.rpsSerie || null,
        id,
      ]
    )

    return NextResponse.json({
      success: true,
      message: "NFS-e emitida com sucesso no Asaas!",
      data: {
        asaas_id: invoice.id,
        status: invoice.status,
        number: invoice.number,
        pdf_url: invoice.pdfUrl,
      },
    })
  } catch (error) {
    console.error("Erro ao emitir NFS-e:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao emitir NFS-e",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
