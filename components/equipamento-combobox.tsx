"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Equipamento {
  id: number
  nome: string
  descricao?: string
  categoria?: string
  valor_hora?: number
  ativo: boolean
}

interface EquipamentoComboboxProps {
  value?: number | null
  onSelect?: (equipamento: Equipamento) => void
  onValueChange?: (id: number | null) => void
  placeholder?: string
  disabled?: boolean
}

export function EquipamentoCombobox({
  value,
  onSelect,
  onValueChange,
  placeholder = "Selecione um equipamento...",
  disabled = false,
}: EquipamentoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null)

  const loadEquipamentos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/equipamentos")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        const equipamentosAtivos = result.data.filter((eq: Equipamento) => eq.ativo)
        setEquipamentos(equipamentosAtivos)

        // Se há um valor selecionado, encontrar o equipamento correspondente
        if (value && equipamentosAtivos.length > 0) {
          const equipamento = equipamentosAtivos.find((eq: Equipamento) => eq.id === value)
          if (equipamento) {
            setSelectedEquipamento(equipamento)
          }
        }
      } else {
        throw new Error(result.error || "Erro ao carregar equipamentos")
      }
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
      setEquipamentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadEquipamentos()
    }
  }, [open])

  // Atualizar equipamento selecionado quando value mudar
  useEffect(() => {
    if (value && equipamentos.length > 0) {
      const equipamento = equipamentos.find((eq) => eq.id === value)
      setSelectedEquipamento(equipamento || null)
    } else if (!value) {
      setSelectedEquipamento(null)
    }
  }, [value, equipamentos])

  const filteredEquipamentos = equipamentos.filter((equipamento) =>
    equipamento.nome.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const handleSelect = (equipamento: Equipamento) => {
    setSelectedEquipamento(equipamento)
    onSelect?.(equipamento)
    onValueChange?.(equipamento.id)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white hover:bg-gray-50"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <span className={selectedEquipamento ? "text-gray-900" : "text-gray-500"}>
              {selectedEquipamento ? selectedEquipamento.nome : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar equipamento..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-500">Carregando equipamentos...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Erro: {error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={loadEquipamentos} className="mt-2 bg-transparent">
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Nenhum equipamento encontrado.</p>
                    {equipamentos.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Verifique se existem equipamentos cadastrados no sistema.
                      </p>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredEquipamentos.map((equipamento) => (
                    <CommandItem
                      key={equipamento.id}
                      value={equipamento.nome}
                      onSelect={() => handleSelect(equipamento)}
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                    >
                      <span className="font-medium">{equipamento.nome}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedEquipamento?.id === equipamento.id ? "opacity-100" : "opacity-0",
                        )}
                      />
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
