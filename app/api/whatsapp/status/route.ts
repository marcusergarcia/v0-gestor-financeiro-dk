import { NextResponse } from "next/server"

export async function GET() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  return NextResponse.json({
    config: {
      phoneNumberId: !!phoneNumberId,
      accessToken: !!accessToken,
      verifyToken: !!verifyToken,
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://seu-dominio.vercel.app"}/api/whatsapp/webhook`,
  })
}
