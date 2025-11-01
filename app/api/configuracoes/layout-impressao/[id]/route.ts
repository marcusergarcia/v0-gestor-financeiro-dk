import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const [rows] = await pool.query("SELECT * FROM layout_impressao_config WHERE id = ?", [params.id])
    const configs = rows as any[]

    if (configs.length === 0) {
      return NextResponse.json({ error: "Configuração não encontrada" }, { status: 404 })
    }

    return NextResponse.json(configs[0])
  } catch (error) {
    console.error("Erro ao buscar configuração:", error)
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 })
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const data = await request.json()

    await pool.query(
      `UPDATE layout_impressao_config SET
        nome = ?,
        tipo = ?,
        font_size = ?,
        title_font_size = ?,
        header_font_size = ?,
        footer_font_size = ?,
        signature_font_size = ?,
        line_height = ?,
        page_margin = ?,
        margin_top = ?,
        margin_bottom = ?,
        content_margin_top = ?,
        content_margin_bottom = ?,
        show_logo = ?,
        show_header = ?,
        show_footer = ?,
        logo_size = ?,
        custom_page_breaks = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        data.nome,
        data.tipo || "contrato",
        data.font_size,
        data.title_font_size,
        data.header_font_size,
        data.footer_font_size,
        data.signature_font_size,
        data.line_height,
        data.page_margin,
        data.margin_top,
        data.margin_bottom,
        data.content_margin_top || 8,
        data.content_margin_bottom || 8,
        data.show_logo,
        data.show_header,
        data.show_footer,
        data.logo_size,
        data.custom_page_breaks,
        params.id,
      ],
    )

    const [updatedConfig] = await pool.query("SELECT * FROM layout_impressao_config WHERE id = ?", [params.id])
    const configs = updatedConfig as any[]

    return NextResponse.json({ success: true, data: configs[0] })
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error)
    return NextResponse.json({ error: "Erro ao atualizar configuração" }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await pool.query("DELETE FROM layout_impressao_config WHERE id = ?", [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir configuração:", error)
    return NextResponse.json({ error: "Erro ao excluir configuração" }, { status: 500 })
  }
}
