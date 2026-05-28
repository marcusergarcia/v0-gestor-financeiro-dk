"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NovoBoletoDialog } from "@/components/financeiro/novo-boleto-dialog"

export default function NovoFinanceiroPage() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Abrir o modal automaticamente quando a página carregar
    setOpen(true)
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Quando o modal fechar, voltar para a página de financeiro
      router.push("/financeiro")
    }
  }

  const handleSuccess = () => {
    // Após sucesso, fechar modal e ir para financeiro
    setOpen(false)
    router.push("/financeiro")
  }

  return (
    <div className="p-6">
      <NovoBoletoDialog open={open} onOpenChange={handleOpenChange} onSuccess={handleSuccess} />

      {/* Conteúdo de fallback caso o modal não abra */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário de novo boleto...</p>
        </div>
      </div>
    </div>
  )
}
