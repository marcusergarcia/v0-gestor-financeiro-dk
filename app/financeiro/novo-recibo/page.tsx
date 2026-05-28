"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NovoReciboDialog } from "@/components/financeiro/novo-recibo-dialog"

export default function NovoReciboPage() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] NovoReciboPage montado, abrindo modal...")
    // Abrir o modal automaticamente quando a página carregar
    setOpen(true)
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    console.log("[v0] Modal estado mudou para:", isOpen)
    setOpen(isOpen)
    if (!isOpen) {
      console.log("[v0] Modal fechado, navegando para /financeiro")
      // Quando o modal fechar, voltar para a página de financeiro
      router.push("/financeiro")
    }
  }

  const handleSuccess = () => {
    console.log("[v0] Recibo criado com sucesso!")
    // Após sucesso, fechar modal e ir para financeiro
    setOpen(false)
    router.push("/financeiro")
  }

  console.log("[v0] Renderizando NovoReciboPage, open:", open)

  return (
    <div className="p-6">
      <NovoReciboDialog open={open} onOpenChange={handleOpenChange} onSuccess={handleSuccess} />

      {/* Conteúdo de fallback caso o modal não abra */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário de novo recibo...</p>
        </div>
      </div>
    </div>
  )
}
