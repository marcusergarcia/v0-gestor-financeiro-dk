"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PenTool, Trash2, RotateCcw, Save, User, UserCheck, Calendar, X, Eye, Maximize2 } from "lucide-react"

interface Assinatura {
  id?: number
  tipo_assinatura: "tecnico" | "responsavel"
  assinatura_base64: string
  nome_assinante: string
  data_assinatura?: string
}

interface SignaturePadProps {
  ordemServicoId?: number
  assinaturas: Assinatura[]
  onAssinaturasChange: (assinaturas: Assinatura[]) => void
  disabled?: boolean
  nomeResponsavel?: string
}

export function SignaturePad({
  ordemServicoId,
  assinaturas,
  onAssinaturasChange,
  disabled = false,
  nomeResponsavel = "",
}: SignaturePadProps) {
  const { toast } = useToast()
  const [isDrawing, setIsDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewAssinatura, setPreviewAssinatura] = useState<Assinatura | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [novaAssinatura, setNovaAssinatura] = useState<{
    tipo_assinatura: "tecnico" | "responsavel"
    nome_assinante: string
  }>({
    tipo_assinatura: "responsavel",
    nome_assinante: "",
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const fullscreenContextRef = useRef<CanvasRenderingContext2D | null>(null)

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Atualizar nome do assinante quando tipo mudar ou nomeResponsavel mudar
  useEffect(() => {
    if (novaAssinatura.tipo_assinatura === "responsavel" && nomeResponsavel) {
      setNovaAssinatura((prev) => ({
        ...prev,
        nome_assinante: nomeResponsavel,
      }))
    }
  }, [novaAssinatura.tipo_assinatura, nomeResponsavel])

  // Bloquear scroll quando fullscreen estiver aberto
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isFullscreen])

  // Configurar canvas normal
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // Configurar canvas para alta resolução
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    context.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Configurar estilo da linha
    context.strokeStyle = "#000000"
    context.lineWidth = window.innerWidth < 768 ? 3 : 2
    context.lineCap = "round"
    context.lineJoin = "round"

    // Fundo branco
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)

    contextRef.current = context
  }, [])

  // Configurar canvas fullscreen
  useEffect(() => {
    if (!isFullscreen) return

    const canvas = fullscreenCanvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // Configurar canvas para tela cheia com alta resolução
    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight - 120 // Espaço para botões

    canvas.width = width * dpr
    canvas.height = height * dpr

    context.scale(dpr, dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Configurar estilo da linha (mais grossa para mobile)
    context.strokeStyle = "#000000"
    context.lineWidth = 4
    context.lineCap = "round"
    context.lineJoin = "round"

    // Fundo branco
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)

    fullscreenContextRef.current = context
  }, [isFullscreen])

  const startDrawing = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    isFullscreenCanvas = false,
  ) => {
    if (disabled) return

    event.preventDefault()
    setIsDrawing(true)
    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current
    const context = isFullscreenCanvas ? fullscreenContextRef.current : contextRef.current
    if (!canvas || !context) return

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ("touches" in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    isFullscreenCanvas = false,
  ) => {
    if (!isDrawing || disabled) return

    event.preventDefault()
    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current
    const context = isFullscreenCanvas ? fullscreenContextRef.current : contextRef.current
    if (!canvas || !context) return

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ("touches" in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const normalContext = contextRef.current
    const fullscreenContext = fullscreenContextRef.current

    if (normalContext) {
      normalContext.beginPath()
    }
    if (fullscreenContext) {
      fullscreenContext.beginPath()
    }
  }

  const limparCanvas = (isFullscreenCanvas = false) => {
    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current
    const context = isFullscreenCanvas ? fullscreenContextRef.current : contextRef.current
    if (!canvas || !context) return

    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  const isCanvasEmpty = (isFullscreenCanvas = false) => {
    const canvas = isFullscreenCanvas ? fullscreenCanvasRef.current : canvasRef.current
    if (!canvas) return true

    const context = canvas.getContext("2d")
    if (!context) return true

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Verificar se todos os pixels são brancos (255, 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) {
        return false
      }
    }
    return true
  }

  const abrirFullscreen = () => {
    if (isMobile && !disabled) {
      setIsFullscreen(true)
    }
  }

  const salvarAssinatura = async (fromFullscreen = false) => {
    if (!novaAssinatura.nome_assinante.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do assinante antes de salvar.",
        variant: "destructive",
      })
      return
    }

    if (isCanvasEmpty(fromFullscreen)) {
      toast({
        title: "Assinatura vazia",
        description: "Desenhe a assinatura antes de salvar.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const canvas = fromFullscreen ? fullscreenCanvasRef.current : canvasRef.current
      if (!canvas) return

      // Converter canvas para base64
      const assinaturaBase64 = canvas.toDataURL("image/png")

      const dadosAssinatura = {
        tipo_assinatura: novaAssinatura.tipo_assinatura,
        nome_assinante: novaAssinatura.nome_assinante,
        assinatura_base64: assinaturaBase64,
      }

      // Se temos ordemServicoId, salvar no servidor
      if (ordemServicoId) {
        const response = await fetch(`/api/ordens-servico/${ordemServicoId}/assinaturas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dadosAssinatura),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erro ao salvar assinatura")
        }

        const novaAssinaturaSalva: Assinatura = {
          id: result.data.id,
          tipo_assinatura: novaAssinatura.tipo_assinatura,
          nome_assinante: novaAssinatura.nome_assinante,
          assinatura_base64: assinaturaBase64,
          data_assinatura: result.data.data_assinatura,
        }

        onAssinaturasChange([...assinaturas, novaAssinaturaSalva])
      } else {
        // Modo de criação - apenas adicionar ao estado local
        const novaAssinaturaLocal: Assinatura = {
          tipo_assinatura: novaAssinatura.tipo_assinatura,
          nome_assinante: novaAssinatura.nome_assinante,
          assinatura_base64: assinaturaBase64,
        }

        onAssinaturasChange([...assinaturas, novaAssinaturaLocal])
      }

      // Limpar formulário e canvas
      setNovaAssinatura({
        tipo_assinatura: "responsavel",
        nome_assinante: nomeResponsavel || "",
      })
      limparCanvas(false)
      limparCanvas(true)

      // Fechar fullscreen se estava aberto
      if (fromFullscreen) {
        setIsFullscreen(false)
      }

      toast({
        title: "Assinatura salva!",
        description: "A assinatura foi adicionada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar assinatura:", error)
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar a assinatura.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const removerAssinatura = async (assinatura: Assinatura, index: number) => {
    try {
      // Se tem ID, remover do servidor
      if (assinatura.id && ordemServicoId) {
        const response = await fetch(`/api/ordens-servico/${ordemServicoId}/assinaturas/${assinatura.id}`, {
          method: "DELETE",
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erro ao remover assinatura")
        }
      }

      // Remover do estado local
      const novasAssinaturas = assinaturas.filter((_, i) => i !== index)
      onAssinaturasChange(novasAssinaturas)

      toast({
        title: "Assinatura removida",
        description: "A assinatura foi removida com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao remover assinatura:", error)
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Erro ao remover a assinatura.",
        variant: "destructive",
      })
    }
  }

  const getTipoAssinaturaLabel = (tipo: string) => {
    switch (tipo) {
      case "tecnico":
        return "Técnico"
      case "responsavel":
        return "Responsável"
      default:
        return tipo
    }
  }

  const getTipoAssinaturaColor = (tipo: string) => {
    switch (tipo) {
      case "tecnico":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "responsavel":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTipoAssinaturaIcon = (tipo: string) => {
    switch (tipo) {
      case "tecnico":
        return <UserCheck className="h-3 w-3" />
      case "responsavel":
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const handleTipoAssinaturaChange = (value: "tecnico" | "responsavel") => {
    setNovaAssinatura((prev) => ({
      tipo_assinatura: value,
      nome_assinante: value === "responsavel" && nomeResponsavel ? nomeResponsavel : "",
    }))
  }

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-t-lg p-4 md:p-6">
          <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
            <PenTool className="h-5 w-5" />
            Assinaturas
          </CardTitle>
          <CardDescription className="text-indigo-100 text-sm">
            Colete assinaturas digitais do técnico e responsável
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-6">
            {/* Formulário de Nova Assinatura */}
            {!disabled && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-indigo-50">
                <h4 className="font-medium mb-4 text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <PenTool className="h-4 w-4" />
                  Nova Assinatura
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo_assinatura">Tipo de Assinatura *</Label>
                      <Select value={novaAssinatura.tipo_assinatura} onValueChange={handleTipoAssinaturaChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnico">Técnico Responsável</SelectItem>
                          <SelectItem value="responsavel">Responsável do Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="nome_assinante">
                        Nome do Assinante *
                        {novaAssinatura.tipo_assinatura === "responsavel" && nomeResponsavel && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Preenchimento Automático
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="nome_assinante"
                        value={novaAssinatura.nome_assinante}
                        onChange={(e) => setNovaAssinatura((prev) => ({ ...prev, nome_assinante: e.target.value }))}
                        placeholder="Nome completo do assinante"
                      />
                      {novaAssinatura.tipo_assinatura === "responsavel" && nomeResponsavel && (
                        <div className="text-xs text-blue-600 mt-1">
                          Preenchido automaticamente com o nome do responsável
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Canvas de Assinatura */}
                  <div className="space-y-2">
                    <Label>Assinatura Digital *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 md:p-4 bg-white relative">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={300}
                        className="w-full h-64 md:h-48 border border-gray-200 rounded cursor-crosshair touch-none"
                        onClick={isMobile ? abrirFullscreen : undefined}
                        onMouseDown={(e) => !isMobile && startDrawing(e, false)}
                        onMouseMove={(e) => !isMobile && draw(e, false)}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={(e) => !isMobile && startDrawing(e, false)}
                        onTouchMove={(e) => !isMobile && draw(e, false)}
                        onTouchEnd={stopDrawing}
                      />
                      {isMobile && (
                        <Button
                          onClick={abrirFullscreen}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          size="lg"
                        >
                          <Maximize2 className="h-5 w-5 mr-2" />
                          Toque para Assinar
                        </Button>
                      )}
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        {isMobile
                          ? "Toque no botão para abrir a tela de assinatura"
                          : "Desenhe a assinatura usando o mouse ou toque na tela"}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  {!isMobile && (
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button
                        onClick={() => salvarAssinatura(false)}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Salvando..." : "Salvar Assinatura"}
                      </Button>
                      <Button
                        onClick={() => limparCanvas(false)}
                        variant="outline"
                        className="flex-1 md:flex-none border-gray-300 bg-transparent"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Assinaturas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <PenTool className="h-4 w-4" />
                  Assinaturas Coletadas
                </h4>
                <Badge variant="outline" className="text-xs md:text-sm">
                  {assinaturas.length} {assinaturas.length === 1 ? "assinatura" : "assinaturas"}
                </Badge>
              </div>

              {assinaturas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assinaturas.map((assinatura, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="p-3 md:p-4 border-b bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getTipoAssinaturaColor(assinatura.tipo_assinatura)}`}
                            >
                              {getTipoAssinaturaIcon(assinatura.tipo_assinatura)}
                              {getTipoAssinaturaLabel(assinatura.tipo_assinatura)}
                            </Badge>
                          </div>
                          {!disabled && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPreviewAssinatura(assinatura)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removerAssinatura(assinatura, index)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-3 md:p-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-900 truncate">{assinatura.nome_assinante}</div>
                          {assinatura.data_assinatura && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(assinatura.data_assinatura).toLocaleString("pt-BR")}
                            </div>
                          )}
                          <div className="mt-2">
                            <img
                              src={assinatura.assinatura_base64 || "/placeholder.svg"}
                              alt={`Assinatura de ${assinatura.nome_assinante}`}
                              className="w-full h-20 md:h-16 object-contain border border-gray-200 rounded bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <PenTool className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-gray-600 text-sm md:text-base mb-2">Nenhuma assinatura coletada</div>
                  <div className="text-xs md:text-sm text-gray-500">
                    {disabled
                      ? "Não há assinaturas para esta ordem de serviço"
                      : "Use o campo acima para coletar assinaturas digitais"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Fullscreen para Assinatura (Mobile) - Z-INDEX MÁXIMO */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                <span className="font-semibold">Assine Aqui</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsFullscreen(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-xs text-white/90 mt-1">Use o dedo para desenhar sua assinatura</div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-2 bg-gray-50 overflow-hidden">
            <div className="h-full border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <canvas
                ref={fullscreenCanvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onTouchStart={(e) => startDrawing(e, true)}
                onTouchMove={(e) => draw(e, true)}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          {/* Botões Fixos - SEMPRE VISÍVEIS */}
          <div className="p-4 bg-white border-t shadow-2xl">
            <div className="flex gap-2">
              <Button
                onClick={() => salvarAssinatura(true)}
                disabled={saving}
                className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                onClick={() => limparCanvas(true)}
                variant="outline"
                className="flex-1 h-12 border-2 border-gray-300 font-semibold shadow-lg"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {previewAssinatura && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTipoAssinaturaColor(previewAssinatura.tipo_assinatura)}>
                  {getTipoAssinaturaIcon(previewAssinatura.tipo_assinatura)}
                  {getTipoAssinaturaLabel(previewAssinatura.tipo_assinatura)}
                </Badge>
                <span className="font-medium text-sm md:text-base truncate">{previewAssinatura.nome_assinante}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreviewAssinatura(null)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 md:p-6">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <img
                  src={previewAssinatura.assinatura_base64 || "/placeholder.svg"}
                  alt={`Assinatura de ${previewAssinatura.nome_assinante}`}
                  className="w-full h-48 md:h-32 object-contain"
                />
              </div>
              {previewAssinatura.data_assinatura && (
                <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Assinado em: {new Date(previewAssinatura.data_assinatura).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
