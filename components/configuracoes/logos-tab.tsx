"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Trash2, Check, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Logo {
  id: number
  tipo: string
  nome: string
  dados: string
  formato: string
  tamanho: number
  dimensoes: string
  ativo: boolean
  created_at: string
}

export function LogosTab() {
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLogos()
  }, [])

  const loadLogos = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()

      if (result.success) {
        setLogos(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar logos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar logos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      })
      return
    }

    // Para favicon, aceitar .ico, .png ou .jpg
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/x-icon", "image/vnd.microsoft.icon"]
    if (tipo === "favicon") {
      if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) {
        toast({
          title: "Erro",
          description: "Para o favicon, use apenas arquivos .ICO, .PNG ou .JPG",
          variant: "destructive",
        })
        return
      }
    } else {
      const allValidTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"]
      if (!allValidTypes.includes(file.type)) {
        toast({
          title: "Erro",
          description: "Formato não suportado. Use PNG, JPG, GIF, WebP ou SVG",
          variant: "destructive",
        })
        return
      }
    }

    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        // Para favicon, se for ICO, converter para formato adequado
        let formato = file.type.split("/")[1]
        if (file.name.endsWith(".ico")) {
          formato = "ico"
        }

        // Se for uma imagem, pegar dimensões
        if (file.type.startsWith("image/") && !file.name.endsWith(".ico")) {
          const img = new Image()
          img.onload = async () => {
            await uploadLogo(tipo, file.name, base64, formato, file.size, `${img.width}x${img.height}`)
          }
          img.onerror = async () => {
            // Se falhar ao carregar imagem (ex: ICO), fazer upload mesmo assim
            await uploadLogo(tipo, file.name, base64, formato, file.size, "32x32")
          }
          img.src = base64
        } else {
          // Para ICO ou outros formatos não image/*, usar dimensões padrão
          await uploadLogo(tipo, file.name, base64, formato, file.size, "32x32")
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  const uploadLogo = async (
    tipo: string,
    nome: string,
    dados: string,
    formato: string,
    tamanho: number,
    dimensoes: string,
  ) => {
    try {
      const response = await fetch("/api/configuracoes/logos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          nome,
          dados,
          formato,
          tamanho,
          dimensoes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Logo ${tipo === "favicon" ? "favicon" : "do " + tipo} salvo com sucesso`,
        })

        // Recarregar logos
        await loadLogos()

        // Se for favicon, recarregar a página para atualizar o ícone
        if (tipo === "favicon") {
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao salvar logo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar logo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async (id: number, tipo: string) => {
    if (!confirm(`Tem certeza que deseja remover este ${tipo === "favicon" ? "favicon" : "logo"}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/configuracoes/logos/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Logo removido com sucesso`,
        })

        await loadLogos()

        // Se for favicon, recarregar a página
        if (tipo === "favicon") {
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao remover logo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao remover logo:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover logo",
        variant: "destructive",
      })
    }
  }

  const getLogo = (tipo: string) => {
    return logos.find((logo) => logo.tipo === tipo && logo.ativo)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando logos...</p>
        </div>
      </div>
    )
  }

  const logoFavicon = getLogo("favicon")
  const logoMenu = getLogo("menu")
  const logoImpressao = getLogo("impressao")
  const logoSistema = getLogo("sistema")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Logos do Sistema
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure todos os logos do sistema incluindo o favicon (ícone da aba do navegador)
          </p>
        </div>
      </div>

      {/* Alerta informativo sobre favicon */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante sobre o Favicon:</strong> Faça upload de um arquivo .ICO (recomendado) ou .PNG/.JPG de
          32x32 pixels. O favicon aparecerá na aba do navegador e nos favoritos. Após o upload, aguarde alguns segundos
          e recarregue a página.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Favicon - Ícone do Sistema */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Favicon (Ícone do Navegador)
                </CardTitle>
                <CardDescription>
                  Arquivo .ICO, .PNG ou .JPG que aparece na aba do navegador e favoritos
                </CardDescription>
              </div>
              {logoFavicon && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-favicon">Arquivo do Favicon (.ICO recomendado)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo-favicon"
                  type="file"
                  accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg"
                  onChange={(e) => handleFileChange(e, "favicon")}
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: .ICO (recomendado), .PNG ou .JPG
                <br />
                Dimensões recomendadas: 32x32 pixels (máx. 5MB)
              </p>
            </div>

            {logoFavicon && (
              <div className="border rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Favicon salvo ({logoFavicon.formato?.toUpperCase()})</p>
                  <Badge variant="outline">{formatBytes(logoFavicon.tamanho)}</Badge>
                </div>

                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 min-h-[100px]">
                  <img
                    src={
                      logoFavicon.dados.startsWith("data:")
                        ? logoFavicon.dados
                        : `data:image/${logoFavicon.formato};base64,${logoFavicon.dados}`
                    }
                    alt="Favicon"
                    className="w-8 h-8 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dimensões: {logoFavicon.dimensoes}</span>
                  <span className="text-green-600">Preview (32x32)</span>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRemoveLogo(logoFavicon.id, "favicon")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Favicon
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logo do Menu */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Logo do Menu</CardTitle>
                <CardDescription>Logo exibido na barra lateral do sistema</CardDescription>
              </div>
              {logoMenu && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-menu">Arquivo do Logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo-menu"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => handleFileChange(e, "menu")}
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Formatos suportados: PNG, JPG, GIF, WebP, SVG (máx. 5MB)</p>
            </div>

            {logoMenu && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Logo salvo ({logoMenu.formato?.toUpperCase()})</p>
                  <Badge variant="outline">{formatBytes(logoMenu.tamanho)}</Badge>
                </div>

                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 min-h-[100px]">
                  <img
                    src={
                      logoMenu.dados.startsWith("data:")
                        ? logoMenu.dados
                        : `data:image/${logoMenu.formato};base64,${logoMenu.dados}`
                    }
                    alt="Logo do menu"
                    className="max-h-20 object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dimensões: {logoMenu.dimensoes}</span>
                  <span className="text-green-600">Preview</span>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRemoveLogo(logoMenu.id, "menu")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logo de Impressão */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Logo de Impressão</CardTitle>
                <CardDescription>Logo usado em documentos e relatórios impressos</CardDescription>
              </div>
              {logoImpressao && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-impressao">Arquivo do Logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo-impressao"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => handleFileChange(e, "impressao")}
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Formatos suportados: PNG, JPG, GIF, WebP, SVG (máx. 5MB)</p>
            </div>

            {logoImpressao && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Logo salvo ({logoImpressao.formato?.toUpperCase()})</p>
                  <Badge variant="outline">{formatBytes(logoImpressao.tamanho)}</Badge>
                </div>

                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 min-h-[100px]">
                  <img
                    src={
                      logoImpressao.dados.startsWith("data:")
                        ? logoImpressao.dados
                        : `data:image/${logoImpressao.formato};base64,${logoImpressao.dados}`
                    }
                    alt="Logo de impressão"
                    className="max-h-20 object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dimensões: {logoImpressao.dimensoes}</span>
                  <span className="text-green-600">Preview</span>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRemoveLogo(logoImpressao.id, "impressao")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logo do Sistema */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Logo do Sistema</CardTitle>
                <CardDescription>Logo principal usado no sistema</CardDescription>
              </div>
              {logoSistema && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-sistema">Arquivo do Logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo-sistema"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => handleFileChange(e, "sistema")}
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Formatos suportados: PNG, JPG, GIF, WebP, SVG (máx. 5MB)</p>
            </div>

            {logoSistema && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Logo salvo ({logoSistema.formato?.toUpperCase()})</p>
                  <Badge variant="outline">{formatBytes(logoSistema.tamanho)}</Badge>
                </div>

                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 min-h-[100px]">
                  <img
                    src={
                      logoSistema.dados.startsWith("data:")
                        ? logoSistema.dados
                        : `data:image/${logoSistema.formato};base64,${logoSistema.dados}`
                    }
                    alt="Logo do sistema"
                    className="max-h-20 object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dimensões: {logoSistema.dimensoes}</span>
                  <span className="text-green-600">Preview</span>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRemoveLogo(logoSistema.id, "sistema")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processando logo...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
