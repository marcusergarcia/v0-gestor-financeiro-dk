"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, Trash2, Eye, X, ImageIcon, FileImage, Calendar } from "lucide-react"

interface Foto {
  id?: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_foto: "antes" | "durante" | "depois"
  descricao?: string
  created_at?: string
  preview?: string
}

interface CameraCaptureProps {
  ordemServicoId?: number
  fotos: Foto[]
  onFotosChange: (fotos: Foto[]) => void
  disabled?: boolean
}

export function CameraCapture({ ordemServicoId, fotos, onFotosChange, disabled = false }: CameraCaptureProps) {
  const { toast } = useToast()
  const [isCapturing, setIsCapturing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewFoto, setPreviewFoto] = useState<Foto | null>(null)
  const [novaFoto, setNovaFoto] = useState<{
    tipo_foto: "antes" | "durante" | "depois"
    descricao: string
  }>({
    tipo_foto: "durante",
    descricao: "",
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const iniciarCamera = async () => {
    try {
      setIsCapturing(true)

      // Tentar acessar a câmera traseira primeiro (melhor para fotos de trabalho)
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Câmera traseira
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error)
      toast({
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive",
      })
      setIsCapturing(false)
    }
  }

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  const capturarFoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Configurar o canvas com as dimensões do vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converter para blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          toast({
            title: "Erro ao capturar",
            description: "Não foi possível capturar a foto.",
            variant: "destructive",
          })
          return
        }

        await salvarFoto(blob, `foto_${Date.now()}.jpg`)
      },
      "image/jpeg",
      0.85,
    )
  }, [novaFoto])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      })
      return
    }

    await salvarFoto(file, file.name)
  }

  const salvarFoto = async (file: Blob, nomeArquivo: string) => {
    if (!novaFoto.tipo_foto) {
      toast({
        title: "Tipo obrigatório",
        description: "Selecione o tipo da foto antes de salvar.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // Criar preview da imagem
      const preview = URL.createObjectURL(file)

      // Se temos ordemServicoId, salvar no servidor
      if (ordemServicoId) {
        const formData = new FormData()
        formData.append("foto", file, nomeArquivo)
        formData.append("tipo_foto", novaFoto.tipo_foto)
        formData.append("descricao", novaFoto.descricao || "")

        const response = await fetch(`/api/ordens-servico/${ordemServicoId}/fotos`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Erro ao salvar foto:", errorText)
          throw new Error(`Erro ao salvar foto: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar foto")
        }

        const novaFotoSalva: Foto = {
          id: result.data.id,
          nome_arquivo: result.data.nome_arquivo || nomeArquivo,
          caminho_arquivo: result.data.caminho_arquivo || preview,
          tipo_foto: novaFoto.tipo_foto,
          descricao: novaFoto.descricao,
          created_at: result.data.created_at || new Date().toISOString(),
          preview: preview,
        }

        onFotosChange([...fotos, novaFotoSalva])
      } else {
        // Modo de criação - apenas adicionar ao estado local
        const novaFotoLocal: Foto = {
          nome_arquivo: nomeArquivo,
          caminho_arquivo: preview,
          tipo_foto: novaFoto.tipo_foto,
          descricao: novaFoto.descricao,
          preview: preview,
        }

        onFotosChange([...fotos, novaFotoLocal])
      }

      // Limpar formulário
      setNovaFoto({
        tipo_foto: "durante",
        descricao: "",
      })

      // Parar câmera se estava ativa
      pararCamera()

      toast({
        title: "Foto salva!",
        description: "A foto foi adicionada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar foto:", error)
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar a foto.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removerFoto = async (foto: Foto, index: number) => {
    try {
      // Se tem ID, remover do servidor
      if (foto.id && ordemServicoId) {
        const response = await fetch(`/api/ordens-servico/${ordemServicoId}/fotos/${foto.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Erro ao remover foto:", errorText)
          throw new Error(`Erro ao remover foto: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Erro ao remover foto")
        }
      }

      // Remover do estado local
      const novasFotos = fotos.filter((_, i) => i !== index)
      onFotosChange(novasFotos)

      // Limpar preview se necessário
      if (foto.preview) {
        URL.revokeObjectURL(foto.preview)
      }

      toast({
        title: "Foto removida",
        description: "A foto foi removida com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao remover foto:", error)
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Erro ao remover a foto.",
        variant: "destructive",
      })
    }
  }

  const getTipoFotoLabel = (tipo: string) => {
    switch (tipo) {
      case "antes":
        return "Antes"
      case "durante":
        return "Durante"
      case "depois":
        return "Depois"
      default:
        return tipo
    }
  }

  const getTipoFotoColor = (tipo: string) => {
    switch (tipo) {
      case "antes":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "durante":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "depois":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white rounded-t-lg">
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos da Ordem de Serviço
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Capture ou faça upload de fotos do serviço realizado
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Formulário de Nova Foto */}
          {!disabled && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-emerald-50">
              <h4 className="font-medium mb-4 text-gray-900 flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Adicionar Nova Foto
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_foto">Tipo da Foto *</Label>
                    <Select
                      value={novaFoto.tipo_foto}
                      onValueChange={(value: "antes" | "durante" | "depois") =>
                        setNovaFoto((prev) => ({ ...prev, tipo_foto: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="antes">Antes do Serviço</SelectItem>
                        <SelectItem value="durante">Durante o Serviço</SelectItem>
                        <SelectItem value="depois">Depois do Serviço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="descricao_foto">Descrição (opcional)</Label>
                    <Input
                      id="descricao_foto"
                      value={novaFoto.descricao}
                      onChange={(e) => setNovaFoto((prev) => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descreva a foto..."
                    />
                  </div>
                </div>

                {/* Câmera */}
                {isCapturing && (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video ref={videoRef} className="w-full h-64 object-cover" autoPlay playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={capturarFoto}
                        disabled={uploading}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {uploading ? "Salvando..." : "Capturar Foto"}
                      </Button>
                      <Button onClick={pararCamera} variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                {!isCapturing && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={iniciarCamera}
                      disabled={uploading}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Abrir Câmera
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Fazer Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista de Fotos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fotos Capturadas
              </h4>
              <Badge variant="outline" className="text-sm">
                {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
              </Badge>
            </div>

            {fotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fotos.map((foto, index) => (
                  <div key={foto.id || index} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="relative">
                      <img
                        src={foto.preview || foto.caminho_arquivo}
                        alt={`Foto ${getTipoFotoLabel(foto.tipo_foto)}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" className={`text-xs ${getTipoFotoColor(foto.tipo_foto)}`}>
                          {getTipoFotoLabel(foto.tipo_foto)}
                        </Badge>
                      </div>
                      {!disabled && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewFoto(foto)}
                            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removerFoto(foto, index)}
                            className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">{foto.nome_arquivo}</div>
                      {foto.descricao && <div className="text-xs text-gray-600 mb-2">{foto.descricao}</div>}
                      {foto.created_at && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(foto.created_at).toLocaleString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-gray-600 mb-2">Nenhuma foto capturada</div>
                <div className="text-sm text-gray-500">
                  {disabled
                    ? "Não há fotos para esta ordem de serviço"
                    : "Use a câmera ou faça upload de arquivos para adicionar fotos"}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Modal de Preview */}
      {previewFoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTipoFotoColor(previewFoto.tipo_foto)}>
                  {getTipoFotoLabel(previewFoto.tipo_foto)}
                </Badge>
                <span className="font-medium">{previewFoto.nome_arquivo}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreviewFoto(null)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={previewFoto.preview || previewFoto.caminho_arquivo}
                alt={`Preview ${getTipoFotoLabel(previewFoto.tipo_foto)}`}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              {previewFoto.descricao && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Descrição:</div>
                  <div className="text-sm text-gray-600">{previewFoto.descricao}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
