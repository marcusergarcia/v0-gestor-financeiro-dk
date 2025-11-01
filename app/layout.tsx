import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "sonner"
import { LayoutContent } from "@/components/layout-content"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestor Financeiro",
  description: "Sistema de gestão financeira",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
