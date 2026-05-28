"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function SemPermissoesPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Sem Permissões</CardTitle>
          <CardDescription>Você não tem permissão para acessar nenhum módulo do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Usuário:</strong> {user?.nome || "Não identificado"}
            </p>
            <p className="mb-2">
              <strong>Email:</strong> {user?.email || "Não identificado"}
            </p>
            <p>
              <strong>Tipo:</strong> {user?.tipo || "Não identificado"}
            </p>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Entre em contato com o administrador do sistema para solicitar permissões de acesso.
          </p>

          <Button onClick={handleLogout} className="w-full bg-transparent" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Fazer Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
