import { NextResponse } from "next/server"

export async function GET() {
  try {
    const token = process.env.PAGSEGURO_TOKEN
    const environment = process.env.PAGSEGURO_ENVIRONMENT || "sandbox"
    const baseUrl = environment === "production" ? "https://api.pagseguro.com" : "https://sandbox.api.pagseguro.com"

    const response = await fetch(`${baseUrl}/public-keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "card",
      }),
    })

    if (!response.ok) {
      throw new Error("Erro ao obter chave pública do PagBank")
    }

    const data = await response.json()

    return NextResponse.json({
      publicKey: data.public_key,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao obter chave pública:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
