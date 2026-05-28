"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn, User, Lock, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [logoMenu, setLogoMenu] = useState<string | null>(null)

  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Se já estiver logado, redirecionar
    if (user) {
      router.push("/")
      return
    }

    // Carregar logo
    carregarLogo()
  }, [user, router])

  const carregarLogo = async () => {
    try {
      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()

      if (logoResult.success && logoResult.data) {
        // Primeiro tenta logo "menu", senao usa logo "sistema"
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu" && logo.ativo)
        const logoSistemaData = logoResult.data.find((logo: any) => logo.tipo === "sistema" && logo.ativo)
        const logoData = logoMenuData || logoSistemaData

        if (logoData) {
          if (logoData.caminho) {
            setLogoMenu(logoData.caminho)
          } else if (logoData.dados) {
            const logoSrc = logoData.dados.startsWith("data:")
              ? logoData.dados
              : `data:image/${logoData.formato || "png"};base64,${logoData.dados}`
            setLogoMenu(logoSrc)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    const result = await login(email, senha)

    if (result.success) {
      setMessage({ type: "success", text: result.message })
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } else {
      setMessage({ type: "error", text: result.message })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Premium animated decorative background blobs for login screen */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px] pointer-events-none -z-10" style={{ animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo e Título */}
        <div className="text-center space-y-4">
          {logoMenu && (
            <div className="flex justify-center">
              <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-16 w-auto object-contain drop-shadow-md" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight font-display">
              Gestor Financeiro
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Faça login para acessar a plataforma</p>
          </div>
        </div>

        {/* Card de Login */}
        <Card className="bg-card/75 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-accent" />
          <CardHeader className="space-y-1.5 text-center pt-6">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 font-display">
              <LogIn className="w-5 h-5 text-primary" />
              Entrar
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Digite suas credenciais de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Mensagem */}
              {message.text && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {message.text}
                </div>
              )}

              {/* Botão de Login */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-center text-sm text-gray-500">© 2025 Gestor Financeiro. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}
