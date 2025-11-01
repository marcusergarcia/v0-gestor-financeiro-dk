"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  Archive,
  AlertTriangle,
  Folder,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TableInfo {
  name: string
  rows: number
  size: number
  engine: string
  created: Date | null
}

interface BackupFile {
  filename: string
  type: "database" | "system"
  size: number
  created: Date
  modified: Date
}

interface SystemInfo {
  projectSize: number
  nodeVersion: string
  platform: string
  uptime: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  name?: string
  version?: string
  dependencies?: number
  devDependencies?: number
}

export function BackupTab() {
  const { toast } = useToast()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [includeData, setIncludeData] = useState(true)
  const [includeNodeModules, setIncludeNodeModules] = useState(false)
  const [includeLogs, setIncludeLogs] = useState(false)
  const [includeBackups, setIncludeBackups] = useState(false)
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingTables, setLoadingTables] = useState(true)
  const [loadingSystem, setLoadingSystem] = useState(true)
  const [loadingBackups, setLoadingBackups] = useState(true)

  useEffect(() => {
    loadTables()
    loadSystemInfo()
    loadBackupFiles()
  }, [])

  const loadTables = async () => {
    try {
      setLoadingTables(true)
      const response = await fetch("/api/backup/database")
      const result = await response.json()

      if (result.success) {
        setTables(result.tables)
        setSelectedTables(result.tables.map((t: TableInfo) => t.name))
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar tabelas do banco",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar tabelas:", error)
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      })
    } finally {
      setLoadingTables(false)
    }
  }

  const loadSystemInfo = async () => {
    try {
      setLoadingSystem(true)
      const response = await fetch("/api/backup/system")
      const result = await response.json()

      if (result.success) {
        setSystemInfo(result.systemInfo)
      }
    } catch (error) {
      console.error("Erro ao carregar informações do sistema:", error)
    } finally {
      setLoadingSystem(false)
    }
  }

  const loadBackupFiles = async () => {
    try {
      setLoadingBackups(true)
      const response = await fetch("/api/backup/list")
      const result = await response.json()

      if (result.success) {
        setBackupFiles(
          result.backups.map((backup: any) => ({
            ...backup,
            created: new Date(backup.created),
            modified: new Date(backup.modified),
          })),
        )
      }
    } catch (error) {
      console.error("Erro ao carregar lista de backups:", error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const createDatabaseBackup = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma tabela para fazer backup",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setProgress(0)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/backup/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: selectedTables,
          includeData,
        }),
      })

      const result = await response.json()
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Backup do banco criado: ${result.filename}`,
        })
        loadBackupFiles()
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar backup do banco",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const createSystemBackup = async () => {
    try {
      setLoading(true)
      setProgress(0)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      const response = await fetch("/api/backup/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeNodeModules,
          includeLogs,
          includeBackups,
        }),
      })

      const result = await response.json()
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Backup do sistema criado: ${result.filename}`,
        })
        loadBackupFiles()
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar backup do sistema",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup/download/${filename}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Sucesso",
          description: "Download iniciado",
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro ao fazer download do arquivo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro no download:", error)
      toast({
        title: "Erro",
        description: "Erro ao fazer download",
        variant: "destructive",
      })
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja excluir o backup "${filename}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/backup/delete/${filename}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Backup excluído com sucesso",
        })
        loadBackupFiles()
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir backup",
        variant: "destructive",
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Sistema de Backup
          </h2>
          <p className="text-gray-600 mt-1">Faça backup completo do banco de dados e arquivos do sistema</p>
        </div>
        <Button
          onClick={() => {
            loadTables()
            loadSystemInfo()
            loadBackupFiles()
          }}
          variant="outline"
          size="sm"
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Criando backup...</p>
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup do Banco de Dados */}
        <Card className="border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Backup do Banco de Dados</CardTitle>
                <CardDescription>Faça backup das tabelas e dados do MySQL</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Opções */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-data"
                  checked={includeData}
                  onCheckedChange={(checked) => setIncludeData(checked as boolean)}
                />
                <label htmlFor="include-data" className="text-sm font-medium">
                  Incluir dados das tabelas
                </label>
              </div>
            </div>

            <Separator />

            {/* Lista de Tabelas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Tabelas ({tables.length})</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTables(tables.map((t) => t.name))}>
                    Todas
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTables([])}>
                    Nenhuma
                  </Button>
                </div>
              </div>

              {loadingTables ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {tables.map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`table-${table.name}`}
                          checked={selectedTables.includes(table.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTables([...selectedTables, table.name])
                            } else {
                              setSelectedTables(selectedTables.filter((t) => t !== table.name))
                            }
                          }}
                        />
                        <label htmlFor={`table-${table.name}`} className="text-sm font-medium">
                          {table.name}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="secondary">{table.rows} linhas</Badge>
                        <Badge variant="outline">{formatBytes(table.size)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={createDatabaseBackup}
              disabled={loading || selectedTables.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Database className="h-4 w-4 mr-2" />
              Criar Backup do Banco
            </Button>
          </CardContent>
        </Card>

        {/* Backup do Sistema */}
        <Card className="border-green-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Backup do Sistema</CardTitle>
                <CardDescription>Faça backup completo dos arquivos do projeto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações do Sistema */}
            {loadingSystem ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            ) : (
              systemInfo && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tamanho:</span>
                    <span className="ml-2 font-medium">{formatBytes(systemInfo.projectSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Node.js:</span>
                    <span className="ml-2 font-medium">{systemInfo.nodeVersion}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Plataforma:</span>
                    <span className="ml-2 font-medium">{systemInfo.platform}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <span className="ml-2 font-medium">{formatUptime(systemInfo.uptime)}</span>
                  </div>
                  {systemInfo.dependencies && (
                    <div>
                      <span className="text-gray-500">Deps:</span>
                      <span className="ml-2 font-medium">{systemInfo.dependencies}</span>
                    </div>
                  )}
                  {systemInfo.version && (
                    <div>
                      <span className="text-gray-500">Versão:</span>
                      <span className="ml-2 font-medium">{systemInfo.version}</span>
                    </div>
                  )}
                </div>
              )
            )}

            <Separator />

            {/* Opções */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-node-modules"
                  checked={includeNodeModules}
                  onCheckedChange={(checked) => setIncludeNodeModules(checked as boolean)}
                />
                <label htmlFor="include-node-modules" className="text-sm font-medium">
                  Incluir node_modules
                </label>
                <Badge variant="secondary" className="text-xs">
                  +~200MB
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-logs"
                  checked={includeLogs}
                  onCheckedChange={(checked) => setIncludeLogs(checked as boolean)}
                />
                <label htmlFor="include-logs" className="text-sm font-medium">
                  Incluir arquivos de log
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-backups"
                  checked={includeBackups}
                  onCheckedChange={(checked) => setIncludeBackups(checked as boolean)}
                />
                <label htmlFor="include-backups" className="text-sm font-medium">
                  Incluir backups anteriores
                </label>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Atenção:</p>
                  <p>O backup do sistema pode ser grande e demorar alguns minutos.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={createSystemBackup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <Archive className="h-4 w-4 mr-2" />
              Criar Backup do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Backups */}
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Folder className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Backups Existentes</CardTitle>
              <CardDescription>Gerencie os arquivos de backup criados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBackups ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : backupFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum backup encontrado</p>
              <p className="text-sm">Crie seu primeiro backup usando as opções acima</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupFiles.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        backup.type === "database" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      }`}
                    >
                      {backup.type === "database" ? (
                        <Database className="h-4 w-4" />
                      ) : (
                        <HardDrive className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(backup.created, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>{formatBytes(backup.size)}</span>
                        <Badge variant={backup.type === "database" ? "default" : "secondary"}>
                          {backup.type === "database" ? "Banco" : "Sistema"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadBackup(backup.filename)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.filename)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
