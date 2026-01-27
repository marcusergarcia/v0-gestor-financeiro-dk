import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST() {
  try {
    console.log("[Migration] Iniciando migração para adicionar campos Asaas na tabela boletos...")
    
    const columns = [
      { name: 'asaas_id', definition: "VARCHAR(100) NULL COMMENT 'ID da cobrança no Asaas (pay_xxxx)'" },
      { name: 'asaas_customer_id', definition: "VARCHAR(100) NULL COMMENT 'ID do cliente no Asaas (cus_xxxx)'" },
      { name: 'asaas_url', definition: "VARCHAR(500) NULL COMMENT 'URL do boleto no Asaas'" },
      { name: 'asaas_bank_slip_url', definition: "VARCHAR(500) NULL COMMENT 'URL do PDF do boleto no Asaas'" },
      { name: 'linha_digitavel', definition: "VARCHAR(100) NULL COMMENT 'Linha digitável do boleto'" },
      { name: 'codigo_barras', definition: "VARCHAR(100) NULL COMMENT 'Código de barras do boleto'" },
      { name: 'gateway', definition: "VARCHAR(20) DEFAULT NULL COMMENT 'Gateway utilizado: pagbank ou asaas'" },
    ]
    
    const results = []
    
    for (const col of columns) {
      try {
        // Verificar se a coluna já existe
        const checkResult = await query(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'boletos' AND COLUMN_NAME = ?`,
          [col.name]
        )
        
        if (checkResult[0].count === 0) {
          // Adicionar coluna
          await query(`ALTER TABLE boletos ADD COLUMN ${col.name} ${col.definition}`)
          results.push({ column: col.name, status: 'added' })
          console.log(`[Migration] Coluna ${col.name} adicionada com sucesso`)
        } else {
          results.push({ column: col.name, status: 'already_exists' })
          console.log(`[Migration] Coluna ${col.name} já existe`)
        }
      } catch (colError: any) {
        // Se for erro de coluna duplicada, ignorar
        if (colError.code === 'ER_DUP_FIELDNAME') {
          results.push({ column: col.name, status: 'already_exists' })
          console.log(`[Migration] Coluna ${col.name} já existe (erro ignorado)`)
        } else {
          results.push({ column: col.name, status: 'error', error: colError.message })
          console.error(`[Migration] Erro ao adicionar coluna ${col.name}:`, colError.message)
        }
      }
    }
    
    // Tentar criar índices
    const indexes = [
      { name: 'idx_boletos_asaas_id', column: 'asaas_id' },
      { name: 'idx_boletos_gateway', column: 'gateway' },
    ]
    
    for (const idx of indexes) {
      try {
        await query(`CREATE INDEX ${idx.name} ON boletos(${idx.column})`)
        results.push({ index: idx.name, status: 'created' })
        console.log(`[Migration] Índice ${idx.name} criado com sucesso`)
      } catch (idxError: any) {
        if (idxError.code === 'ER_DUP_KEYNAME') {
          results.push({ index: idx.name, status: 'already_exists' })
          console.log(`[Migration] Índice ${idx.name} já existe`)
        } else {
          results.push({ index: idx.name, status: 'error', error: idxError.message })
          console.error(`[Migration] Erro ao criar índice ${idx.name}:`, idxError.message)
        }
      }
    }
    
    console.log("[Migration] Migração concluída!")
    
    return NextResponse.json({
      success: true,
      message: "Migração executada com sucesso",
      results
    })
  } catch (error) {
    console.error("[Migration] Erro na migração:", error)
    return NextResponse.json({
      success: false,
      message: "Erro ao executar migração",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST para executar a migração que adiciona os campos Asaas na tabela boletos"
  })
}
