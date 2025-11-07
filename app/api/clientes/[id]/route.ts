import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const [rows] = await pool.execute(`SELECT * FROM clientes WHERE id = ?`, [id])

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await request.json()

    console.log("Dados recebidos para atualização do cliente:", data)

    const [currentRows] = await pool.execute(`SELECT * FROM clientes WHERE id = ?`, [id])

    if (!Array.isArray(currentRows) || currentRows.length === 0) {
      return NextResponse.json({ success: false, message: "Cliente não encontrado" }, { status: 404 })
    }

    const currentClient = currentRows[0] as any

    const updatedData = {
      nome: data.nome !== undefined ? data.nome.toUpperCase() : currentClient.nome,
      codigo: data.codigo !== undefined ? data.codigo.toUpperCase() : currentClient.codigo,
      cnpj: data.cnpj !== undefined ? data.cnpj.toUpperCase() : currentClient.cnpj,
      cpf: data.cpf !== undefined ? data.cpf.toUpperCase() : currentClient.cpf,
      email: data.email !== undefined ? data.email.toLowerCase() : currentClient.email,
      telefone: data.telefone !== undefined ? data.telefone : currentClient.telefone,
      endereco: data.endereco !== undefined ? data.endereco.toUpperCase() : currentClient.endereco,
      bairro: data.bairro !== undefined ? data.bairro.toUpperCase() : currentClient.bairro,
      cidade: data.cidade !== undefined ? data.cidade.toUpperCase() : currentClient.cidade,
      estado: data.estado !== undefined ? data.estado.toUpperCase() : currentClient.estado,
      cep: data.cep !== undefined ? data.cep : currentClient.cep,
      contato: data.contato !== undefined ? data.contato.toUpperCase() : currentClient.contato,
      distancia_km: data.distancia_km !== undefined ? data.distancia_km : currentClient.distancia_km,
      latitude: data.latitude !== undefined ? data.latitude : currentClient.latitude,
      longitude: data.longitude !== undefined ? data.longitude : currentClient.longitude,
      sindico: data.sindico !== undefined ? data.sindico.toUpperCase() : currentClient.sindico,
      rg_sindico: data.rg_sindico !== undefined ? data.rg_sindico.toUpperCase() : currentClient.rg_sindico,
      cpf_sindico: data.cpf_sindico !== undefined ? data.cpf_sindico.toUpperCase() : currentClient.cpf_sindico,
      zelador: data.zelador !== undefined ? data.zelador.toUpperCase() : currentClient.zelador,
      tem_contrato: data.tem_contrato !== undefined ? data.tem_contrato : currentClient.tem_contrato,
      dia_contrato: data.dia_contrato !== undefined ? data.dia_contrato : currentClient.dia_contrato,
      observacoes: data.observacoes !== undefined ? data.observacoes.toUpperCase() : currentClient.observacoes,
      nome_adm: data.nome_adm !== undefined ? data.nome_adm.toUpperCase() : currentClient.nome_adm,
      contato_adm: data.contato_adm !== undefined ? data.contato_adm.toUpperCase() : currentClient.contato_adm,
      telefone_adm: data.telefone_adm !== undefined ? data.telefone_adm : currentClient.telefone_adm,
      email_adm: data.email_adm !== undefined ? data.email_adm.toLowerCase() : currentClient.email_adm,
    }

    console.log("Dados mesclados para atualização:", updatedData)

    await pool.execute(
      `UPDATE clientes SET 
        nome = ?, 
        codigo = ?, 
        cnpj = ?, 
        cpf = ?, 
        email = ?, 
        telefone = ?, 
        endereco = ?, 
        bairro = ?, 
        cidade = ?, 
        estado = ?, 
        cep = ?, 
        contato = ?, 
        distancia_km = ?,
        latitude = ?,
        longitude = ?,
        sindico = ?, 
        rg_sindico = ?, 
        cpf_sindico = ?, 
        zelador = ?, 
        tem_contrato = ?, 
        dia_contrato = ?, 
        observacoes = ?,
        nome_adm = ?,
        contato_adm = ?,
        telefone_adm = ?,
        email_adm = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        updatedData.nome,
        updatedData.codigo,
        updatedData.cnpj,
        updatedData.cpf,
        updatedData.email,
        updatedData.telefone,
        updatedData.endereco,
        updatedData.bairro,
        updatedData.cidade,
        updatedData.estado,
        updatedData.cep,
        updatedData.contato,
        updatedData.distancia_km,
        updatedData.latitude,
        updatedData.longitude,
        updatedData.sindico,
        updatedData.rg_sindico,
        updatedData.cpf_sindico,
        updatedData.zelador,
        updatedData.tem_contrato,
        updatedData.dia_contrato,
        updatedData.observacoes,
        updatedData.nome_adm,
        updatedData.contato_adm,
        updatedData.telefone_adm,
        updatedData.email_adm,
        id,
      ],
    )

    console.log("Cliente atualizado com sucesso")

    return NextResponse.json({
      success: true,
      message: "Cliente atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Verificar se o cliente existe
    const [rows] = await pool.execute(`SELECT * FROM clientes WHERE id = ?`, [id])

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Cliente não encontrado" }, { status: 404 })
    }

    // Verificar se o cliente tem contratos ou orçamentos associados
    const [contratos] = await pool.execute(`SELECT COUNT(*) as count FROM contratos_conservacao WHERE cliente_id = ?`, [
      id,
    ])

    const [orcamentos] = await pool.execute(`SELECT COUNT(*) as count FROM orcamentos WHERE cliente_id = ?`, [id])

    const contratoCount = (contratos as any[])[0]?.count || 0
    const orcamentoCount = (orcamentos as any[])[0]?.count || 0

    if (contratoCount > 0 || orcamentoCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Não é possível excluir este cliente pois ele possui contratos ou orçamentos associados",
        },
        { status: 400 },
      )
    }

    // Excluir o cliente
    await pool.execute(`DELETE FROM clientes WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Cliente excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir cliente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
