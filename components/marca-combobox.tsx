"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
      (marca) => marca.nome.toLowerCase().includes(search) || marca.sigla.toLowerCase().includes(search),
    )
  }, [marcas, searchValue])

  const selectedMarca = marcas.find((marca) => marca.nome === value)

  return (
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
                <CommandEmpty>{searchValue ? "Nenhuma marca encontrada." : "Nenhuma marca disponível."}</CommandEmpty>
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
                      keywords={[marca.nome.toLowerCase(), marca.sigla.toLowerCase()]}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === marca.nome ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">
                        {marca.nome} {marca.sigla && `(${marca.sigla})`}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
