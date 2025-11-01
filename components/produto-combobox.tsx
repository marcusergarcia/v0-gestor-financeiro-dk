"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface Produto {
  tipo: undefined
  marca: undefined
  id: string
  codigo: string
  descricao: string
  categoria_id: string
  marca_id: string
  ncm?: string
  unidade: string
  valor_unitario: number
  valor_mao_obra: number
  valor_custo: number
  margem_lucro: number
  estoque: number
  estoque_minimo: number
  observacoes?: string
  ativo: boolean
}

interface ProdutoComboboxProps {
  onSelect: (produto: Produto) => void
  placeholder?: string
}

export function ProdutoCombobox({ onSelect, placeholder = "Selecione um produto..." }: ProdutoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const loadProdutos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/produtos?limit=1000")
      const result = await response.json()

      if (result.success) {
        setProdutos(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadProdutos()
    }
  }, [open])

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.descricao.toLowerCase().includes(searchValue.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const handleSelect = (produto: Produto) => {
    onSelect(produto)
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
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar produto..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Carregando produtos...</div>
            ) : (
              <>
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredProdutos.map((produto) => (
                    <CommandItem
                      key={produto.id}
                      value={`${produto.codigo} ${produto.descricao}`}
                      onSelect={() => handleSelect(produto)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {produto.codigo}
                          </Badge>
                          <span className="font-medium">{produto.descricao}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Valor: R$ {produto.valor_unitario.toFixed(2)} | MDO: R${" "}
                          {produto.valor_mao_obra?.toFixed(2) || "0,00"} | Estoque: {produto.estoque}
                        </div>
                      </div>
                      <Check className={cn("ml-auto h-4 w-4", "opacity-0")} />
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
