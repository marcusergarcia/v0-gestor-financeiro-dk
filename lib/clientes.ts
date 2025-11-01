import { pool } from "./db"

export interface Cliente {
  id: number
  codigo?: string
  nome: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  contato?: string
  distancia_km?: number
  sindico?: string
  rg_sindico?: string
  cpf_sindico?: string
  zelador?: string
  tem_contrato?: boolean
  dia_contrato?: number
  observacoes?: string
  status?: string
  created_at?: string
  // Novos campos da administradora
  nome_adm?: string
  contato_adm?: string
  telefone_adm?: string
  email_adm?: string
}

export async function getClientes(limit = 2000): Promise<Cliente[]> {
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        id,
        codigo,
        nome,
        cnpj,
        cpf,
        email,
        telefone,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        contato,
        distancia_km,
        sindico,
        rg_sindico,
        cpf_sindico,
        zelador,
        tem_contrato,
        dia_contrato,
        observacoes,
        status,
        created_at,
        nome_adm,
        contato_adm,
        telefone_adm,
        email_adm
      FROM clientes 
      WHERE (status IS NULL OR status != 'inativo')
      ORDER BY 
        CASE WHEN tem_contrato = 1 THEN 0 ELSE 1 END,
        nome 
      LIMIT ?
    `,
      [limit],
    )

    console.log(`Clientes encontrados: ${(rows as any[]).length}`)
    return rows as Cliente[]
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return []
  }
}

export async function getClienteById(id: number): Promise<Cliente | null> {
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        id,
        codigo,
        nome,
        cnpj,
        cpf,
        email,
        telefone,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        contato,
        distancia_km,
        sindico,
        rg_sindico,
        cpf_sindico,
        zelador,
        tem_contrato,
        dia_contrato,
        observacoes,
        status,
        created_at,
        nome_adm,
        contato_adm,
        telefone_adm,
        email_adm
      FROM clientes 
      WHERE id = ?
    `,
      [id],
    )

    const clientes = rows as Cliente[]
    return clientes[0] || null
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
    return null
  }
}

export async function searchClientes(searchTerm: string, limit = 500): Promise<Cliente[]> {
  try {
    const searchPattern = `%${searchTerm}%`
    const [rows] = await pool.execute(
      `
      SELECT 
        id,
        codigo,
        nome,
        cnpj,
        cpf,
        email,
        telefone,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        contato,
        distancia_km,
        sindico,
        rg_sindico,
        cpf_sindico,
        zelador,
        tem_contrato,
        dia_contrato,
        observacoes,
        status,
        created_at,
        nome_adm,
        contato_adm,
        telefone_adm,
        email_adm
      FROM clientes 
      WHERE (status IS NULL OR status != 'inativo')
      AND (
        nome LIKE ? OR 
        codigo LIKE ? OR 
        cnpj LIKE ? OR 
        cpf LIKE ? OR 
        email LIKE ? OR
        nome_adm LIKE ?
      )
      ORDER BY 
        CASE WHEN tem_contrato = 1 THEN 0 ELSE 1 END,
        nome 
      LIMIT ?
    `,
      [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit],
    )

    return rows as Cliente[]
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return []
  }
}

export async function createCliente(clienteData: Omit<Cliente, "id" | "created_at">): Promise<Cliente | null> {
  try {
    const [result] = await pool.execute(
      `
      INSERT INTO clientes (
        codigo, nome, cnpj, cpf, email, telefone, endereco, bairro, 
        cidade, estado, cep, contato, distancia_km, sindico, rg_sindico, 
        cpf_sindico, zelador, tem_contrato, dia_contrato, observacoes, status,
        nome_adm, contato_adm, telefone_adm, email_adm
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        clienteData.codigo,
        clienteData.nome,
        clienteData.cnpj,
        clienteData.cpf,
        clienteData.email,
        clienteData.telefone,
        clienteData.endereco,
        clienteData.bairro,
        clienteData.cidade,
        clienteData.estado,
        clienteData.cep,
        clienteData.contato,
        clienteData.distancia_km,
        clienteData.sindico,
        clienteData.rg_sindico,
        clienteData.cpf_sindico,
        clienteData.zelador,
        clienteData.tem_contrato,
        clienteData.dia_contrato,
        clienteData.observacoes,
        clienteData.status || "ativo",
        clienteData.nome_adm,
        clienteData.contato_adm,
        clienteData.telefone_adm,
        clienteData.email_adm,
      ],
    )

    const insertResult = result as any
    if (insertResult.insertId) {
      return await getClienteById(insertResult.insertId)
    }

    return null
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return null
  }
}

export async function updateCliente(id: number, clienteData: Partial<Cliente>): Promise<Cliente | null> {
  try {
    console.log("Atualizando cliente ID:", id, "com dados:", clienteData)

    // Construir query dinamicamente apenas com campos fornecidos
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (clienteData.codigo !== undefined) {
      updateFields.push("codigo = ?")
      updateValues.push(clienteData.codigo)
    }
    if (clienteData.nome !== undefined) {
      updateFields.push("nome = ?")
      updateValues.push(clienteData.nome)
    }
    if (clienteData.cnpj !== undefined) {
      updateFields.push("cnpj = ?")
      updateValues.push(clienteData.cnpj)
    }
    if (clienteData.cpf !== undefined) {
      updateFields.push("cpf = ?")
      updateValues.push(clienteData.cpf)
    }
    if (clienteData.email !== undefined) {
      updateFields.push("email = ?")
      updateValues.push(clienteData.email)
    }
    if (clienteData.telefone !== undefined) {
      updateFields.push("telefone = ?")
      updateValues.push(clienteData.telefone)
    }
    if (clienteData.endereco !== undefined) {
      updateFields.push("endereco = ?")
      updateValues.push(clienteData.endereco)
    }
    if (clienteData.bairro !== undefined) {
      updateFields.push("bairro = ?")
      updateValues.push(clienteData.bairro)
    }
    if (clienteData.cidade !== undefined) {
      updateFields.push("cidade = ?")
      updateValues.push(clienteData.cidade)
    }
    if (clienteData.estado !== undefined) {
      updateFields.push("estado = ?")
      updateValues.push(clienteData.estado)
    }
    if (clienteData.cep !== undefined) {
      updateFields.push("cep = ?")
      updateValues.push(clienteData.cep)
    }
    if (clienteData.contato !== undefined) {
      updateFields.push("contato = ?")
      updateValues.push(clienteData.contato)
    }
    if (clienteData.distancia_km !== undefined) {
      updateFields.push("distancia_km = ?")
      updateValues.push(clienteData.distancia_km)
    }
    if (clienteData.sindico !== undefined) {
      updateFields.push("sindico = ?")
      updateValues.push(clienteData.sindico)
    }
    if (clienteData.rg_sindico !== undefined) {
      updateFields.push("rg_sindico = ?")
      updateValues.push(clienteData.rg_sindico)
    }
    if (clienteData.cpf_sindico !== undefined) {
      updateFields.push("cpf_sindico = ?")
      updateValues.push(clienteData.cpf_sindico)
    }
    if (clienteData.zelador !== undefined) {
      updateFields.push("zelador = ?")
      updateValues.push(clienteData.zelador)
    }
    if (clienteData.tem_contrato !== undefined) {
      updateFields.push("tem_contrato = ?")
      updateValues.push(clienteData.tem_contrato)
    }
    if (clienteData.dia_contrato !== undefined) {
      updateFields.push("dia_contrato = ?")
      updateValues.push(clienteData.dia_contrato)
    }
    if (clienteData.observacoes !== undefined) {
      updateFields.push("observacoes = ?")
      updateValues.push(clienteData.observacoes)
    }
    if (clienteData.status !== undefined) {
      updateFields.push("status = ?")
      updateValues.push(clienteData.status)
    }
    if (clienteData.nome_adm !== undefined) {
      updateFields.push("nome_adm = ?")
      updateValues.push(clienteData.nome_adm)
    }
    if (clienteData.contato_adm !== undefined) {
      updateFields.push("contato_adm = ?")
      updateValues.push(clienteData.contato_adm)
    }
    if (clienteData.telefone_adm !== undefined) {
      updateFields.push("telefone_adm = ?")
      updateValues.push(clienteData.telefone_adm)
    }
    if (clienteData.email_adm !== undefined) {
      updateFields.push("email_adm = ?")
      updateValues.push(clienteData.email_adm)
    }

    if (updateFields.length === 0) {
      console.log("Nenhum campo para atualizar")
      return await getClienteById(id)
    }

    // Adicionar ID no final dos valores
    updateValues.push(id)

    const query = `UPDATE clientes SET ${updateFields.join(", ")} WHERE id = ?`

    console.log("Query SQL:", query)
    console.log("Valores:", updateValues)

    const [result] = await pool.execute(query, updateValues)

    console.log("Resultado da atualização:", result)

    return await getClienteById(id)
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return null
  }
}

export async function getProximoCodigoCliente(): Promise<string> {
  try {
    const [rows] = await pool.execute(
      'SELECT codigo FROM clientes WHERE codigo REGEXP "^CLI[0-9]+$" ORDER BY CAST(SUBSTRING(codigo, 4) AS UNSIGNED) DESC LIMIT 1',
    )

    const clientesArray = rows as any[]

    if (clientesArray.length === 0) {
      return "CLI001"
    }

    const ultimoCodigo = clientesArray[0].codigo
    const numeroAtual = Number.parseInt(ultimoCodigo.substring(3))
    const proximoNumero = numeroAtual + 1

    return `CLI${proximoNumero.toString().padStart(3, "0")}`
  } catch (error) {
    console.error("Erro ao gerar próximo código de cliente:", error)
    return "CLI001"
  }
}
