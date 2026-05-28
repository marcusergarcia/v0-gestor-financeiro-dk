"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Marca {
  id: number
  nome: string
  sigla: string
}

interface MarcaComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MarcaCombobox({
  value,
  onValueChange,
  placeholder = "Selecione uma marca",
  disabled = false,
  className,
}: MarcaComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [marcas, setMarcas] = React.useState<Marca[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Dialog de nova marca
  const [novaMarcaDialogOpen, setNovaMarcaDialogOpen] = React.useState(false)
  const [novaMarcaNome, setNovaMarcaNome] = React.useState("")
  const [novaMarcaSigla, setNovaMarcaSigla] = React.useState("")
  const [salvandoMarca, setSalvandoMarca] = React.useState(false)

  const { toast } = useToast()

  React.useEffect(() => {
    loadMarcas()
  }, [])

  const loadMarcas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/marcas?limit=1000")
      const result = await response.json()

      if (result.success) {
        setMarcas(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar marcas:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar marcas baseado na busca
  const filteredMarcas = React.useMemo(() => {
    if (!searchValue) return marcas

    const search = searchValue.toLowerCase()
    return marcas.filter(
      (marca) => marca.nome?.toLowerCase().includes(search) || (marca.sigla && marca.sigla.toLowerCase().includes(search)),
    )
  }, [marcas, searchValue])

  const selectedMarca = marcas.find((marca) => marca.nome === value)

  const handleAbrirNovaMarca = () => {
    // Pré-preencher o nome com o que foi digitado na busca, se houver
    setNovaMarcaNome(searchValue)
    setNovaMarcaSigla("")
    setOpen(false)
    setNovaMarcaDialogOpen(true)
  }

  const handleSalvarNovaMarca = async () => {
    if (!novaMarcaNome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da marca é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      setSalvandoMarca(true)

      const response = await fetch("/api/marcas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novaMarcaNome.trim(),
          sigla: novaMarcaSigla.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Marca criada!",
          description: `A marca "${result.data.nome}" foi adicionada com sucesso.`,
        })

        // Recarregar lista e selecionar a nova marca automaticamente
        await loadMarcas()
        onValueChange?.(result.data.nome)

        setNovaMarcaDialogOpen(false)
        setNovaMarcaNome("")
        setNovaMarcaSigla("")
        setSearchValue("")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar marca",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar marca:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSalvandoMarca(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {selectedMarca ? (
              <span className="truncate">
                {selectedMarca.nome} {selectedMarca.sigla && `(${selectedMarca.sigla})`}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Buscar marca..." value={searchValue} onValueChange={setSearchValue} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando marcas...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      {searchValue ? `Nenhuma marca encontrada para "${searchValue}".` : "Nenhuma marca disponível."}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="Nenhuma marca"
                      onSelect={() => {
                        onValueChange?.("Nenhuma marca")
                        setOpen(false)
                        setSearchValue("")
                      }}
                      keywords={["nenhuma", "marca", "sem", "vazio"]}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === "Nenhuma marca" ? "opacity-100" : "opacity-0")} />
                      <span className="text-muted-foreground">Nenhuma marca</span>
                    </CommandItem>
                    {filteredMarcas.map((marca) => (
                      <CommandItem
                        key={marca.id}
                        value={marca.nome}
                        onSelect={() => {
                          onValueChange?.(marca.nome)
                          setOpen(false)
                          setSearchValue("")
                        }}
                        keywords={[marca.nome?.toLowerCase() || "", marca.sigla?.toLowerCase() || ""]}
                      >
                        <Check className={cn("mr-2 h-4 w-4", value === marca.nome ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">
                          {marca.nome} {marca.sigla && `(${marca.sigla})`}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  {/* Botão de adicionar nova marca */}
                  <CommandGroup>
                    <CommandItem
                      value="__nova_marca__"
                      onSelect={handleAbrirNovaMarca}
                      className="text-primary font-medium cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>
                        {searchValue ? `Adicionar "${searchValue}" como nova marca` : "Adicionar nova marca"}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog de Nova Marca */}
      <Dialog open={novaMarcaDialogOpen} onOpenChange={setNovaMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Nova Marca
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da nova marca. A sigla é opcional e será gerada automaticamente se não informada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nova-marca-nome">Nome da Marca *</Label>
              <Input
                id="nova-marca-nome"
                value={novaMarcaNome}
                onChange={(e) => setNovaMarcaNome(e.target.value)}
                placeholder="Ex: Samsung, Apple, LG..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSalvarNovaMarca()
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nova-marca-sigla">
                Sigla{" "}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
              <Input
                id="nova-marca-sigla"
                value={novaMarcaSigla}
                onChange={(e) => setNovaMarcaSigla(e.target.value.toUpperCase())}
                placeholder="Ex: SAM, APL, LG..."
                maxLength={10}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSalvarNovaMarca()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Se não informada, será gerada automaticamente a partir do nome.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNovaMarcaDialogOpen(false)}
              disabled={salvandoMarca}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvarNovaMarca}
              disabled={salvandoMarca || !novaMarcaNome.trim()}
            >
              {salvandoMarca ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Marca
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
