import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const { tables, includeData } = await request.json()

    // Criar diretório de backup se não existir
    const backupDir = join(process.cwd(), "backups", "database")
    await mkdir(backupDir, { recursive: true })

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss")
    const filename = `backup_database_${timestamp}.sql`
    const filepath = join(backupDir, filename)

    let sqlContent = `-- Backup do Banco de Dados\n-- Data: ${new Date().toLocaleString()}\n-- Tabelas: ${tables.join(", ")}\n\n`

    // Desabilitar verificações de chave estrangeira
    sqlContent += "SET FOREIGN_KEY_CHECKS = 0;\n\n"

    for (const table of tables) {
      try {
        // Obter estrutura da tabela
        const [createTableResult] = await pool.execute(`SHOW CREATE TABLE ${table}`)
        const createTableSQL = (createTableResult as any[])[0]["Create Table"]

        sqlContent += `-- Estrutura da tabela ${table}\n`
        sqlContent += `DROP TABLE IF EXISTS \`${table}\`;\n`
        sqlContent += `${createTableSQL};\n\n`

        if (includeData) {
          // Obter dados da tabela
          const [rows] = await pool.execute(`SELECT * FROM ${table}`)
          const data = rows as any[]

          if (data.length > 0) {
            sqlContent += `-- Dados da tabela ${table}\n`

            // Obter nomes das colunas
            const [columns] = await pool.execute(`SHOW COLUMNS FROM ${table}`)
            const columnNames = (columns as any[]).map((col) => col.Field)

            sqlContent += `INSERT INTO \`${table}\` (\`${columnNames.join("`, `")}\`) VALUES\n`

            const values = data.map((row) => {
              const rowValues = columnNames.map((col) => {
                const value = row[col]
                if (value === null) return "NULL"
                if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`
                if (value instanceof Date) return `'${format(value, "yyyy-MM-dd HH:mm:ss")}'`
                return value
              })
              return `(${rowValues.join(", ")})`
            })

            sqlContent += values.join(",\n") + ";\n\n"
          }
        }
      } catch (error) {
        console.error(`Erro ao fazer backup da tabela ${table}:`, error)
        sqlContent += `-- ERRO ao fazer backup da tabela ${table}: ${error}\n\n`
      }
    }

    // Reabilitar verificações de chave estrangeira
    sqlContent += "SET FOREIGN_KEY_CHECKS = 1;\n"

    // Salvar arquivo
    await writeFile(filepath, sqlContent, "utf8")

    return NextResponse.json({
      success: true,
      message: "Backup do banco de dados criado com sucesso",
      filename,
      path: filepath,
      size: Buffer.byteLength(sqlContent, "utf8"),
    })
  } catch (error) {
    console.error("Erro ao criar backup do banco:", error)
    return NextResponse.json({ success: false, message: "Erro ao criar backup do banco de dados" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Listar todas as tabelas do banco
    const [tables] = await pool.execute("SHOW TABLES")
    const tableNames = (tables as any[]).map((row) => Object.values(row)[0])

    // Obter informações sobre cada tabela
    const tableInfo = []
    for (const tableName of tableNames) {
      try {
        const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`)
        const count = (rows as any[])[0].count

        const [status] = await pool.execute(`SHOW TABLE STATUS LIKE '${tableName}'`)
        const tableStatus = (status as any[])[0]

        tableInfo.push({
          name: tableName,
          rows: count,
          size: tableStatus.Data_length + tableStatus.Index_length,
          engine: tableStatus.Engine,
          created: tableStatus.Create_time,
        })
      } catch (error) {
        console.error(`Erro ao obter info da tabela ${tableName}:`, error)
        tableInfo.push({
          name: tableName,
          rows: 0,
          size: 0,
          engine: "Unknown",
          created: null,
        })
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableInfo,
    })
  } catch (error) {
    console.error("Erro ao listar tabelas:", error)
    return NextResponse.json({ success: false, message: "Erro ao listar tabelas do banco" }, { status: 500 })
  }
}
