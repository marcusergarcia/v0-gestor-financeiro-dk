import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

try {
  // Check if columns already exist
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME IN ('contribuinte_icms', 'inscricao_estadual')`,
    [process.env.DB_NAME]
  );

  const existingCols = columns.map((c) => c.COLUMN_NAME);

  if (!existingCols.includes("contribuinte_icms")) {
    await connection.execute(
      `ALTER TABLE clientes ADD COLUMN contribuinte_icms TINYINT NOT NULL DEFAULT 0 COMMENT '0=Nao contribuinte, 1=Contribuinte ICMS, 2=Contribuinte Isento'`
    );
    console.log("Column contribuinte_icms added successfully");
  } else {
    console.log("Column contribuinte_icms already exists");
  }

  if (!existingCols.includes("inscricao_estadual")) {
    await connection.execute(
      `ALTER TABLE clientes ADD COLUMN inscricao_estadual VARCHAR(20) DEFAULT NULL COMMENT 'Inscricao Estadual - obrigatorio quando contribuinte_icms=1'`
    );
    console.log("Column inscricao_estadual added successfully");
  } else {
    console.log("Column inscricao_estadual already exists");
  }

  console.log("Migration completed successfully!");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await connection.end();
}
