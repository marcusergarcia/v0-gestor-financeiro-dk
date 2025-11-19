"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ClienteFormDialog } from "./cliente-form-dialog"

export interface Cliente {
  id: string
  codigo?: string
  nome: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  distancia_km?: number
  tem_contrato?: boolean
  // Campos da administradora
  nome_adm?: string
  contato_adm?: string
  telefone_adm?: string
  email_adm?: string
}

interface ClienteComboboxProps {
  value?: Cliente | null
  onValueChange?: (cliente: Cliente | null) => void
  onClienteSelect?: (cliente: Cliente | null) => void
  placeholder?: string
  disabled?: boolean
  showNewClientButton?: boolean
}

export function ClienteCombobox({
  value,
  onValueChange,
  onClienteSelect,
  placeholder = "Selecione um cliente...",
  disabled,
  showNewClientButton = false,
}: ClienteComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [clientes, setClientes] = React.useState<Cliente[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showDialog, setShowDialog] = React.useState(false)

  // Função unificada para lidar com mudanças
  const handleClienteChange = React.useCallback(
    (cliente: Cliente | null) => {
      console.log("Cliente selecionado:", cliente)
      // Chama ambas as funções se existirem
      if (onValueChange) {
        onValueChange(cliente)
      }
      if (onClienteSelect) {
        onClienteSelect(cliente)
      }
    },
    [onValueChange, onClienteSelect],
  )

  const loadClientes = React.useCallback(async (search?: string) => {
    try {
      setLoading(true)
      let url = "/api/clientes"

      if (search && search.trim()) {
        url += `?search=${encodeURIComponent(search.trim())}`
      }

      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        console.log(`Clientes carregados: ${result.data?.length || 0}`)
        setClientes(result.data || [])
      } else {
        console.error("Erro na resposta da API:", result.message)
        setClientes([])
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadClientes()
  }, [loadClientes])

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        loadClientes(searchTerm.trim())
      } else {
        loadClientes()
      }
    }, 500) // Aumentar para 500ms para melhor performance

    return () => clearTimeout(timeoutId)
  }, [searchTerm, loadClientes])

  const handleClienteCreated = () => {
    loadClientes()
    setShowDialog(false)
  }

  const handleSelectCliente = (cliente: Cliente) => {
    console.log("Selecionando cliente:", cliente)
    const novoCliente = cliente.id === value?.id ? null : cliente
    handleClienteChange(novoCliente)
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent min-h-[44px] px-3 sm:px-4"
            disabled={disabled}
          >
            {value ? (
              <div className="flex items-center gap-1.5 sm:gap-2 truncate max-w-full overflow-hidden">
                {value.codigo && (
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {value.codigo}
                  </Badge>
                )}
                <span className="truncate text-sm sm:text-base">{value.nome}</span>
                {value.tem_contrato && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 shrink-0 hidden sm:inline-flex">
                    Contrato
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-sm sm:text-base">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[calc(100vw-2rem)] sm:w-[400px] md:w-[500px] p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar cliente..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="h-9"
            />
            <CommandList className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="ml-2">Carregando...</span>
                  </div>
                ) : (
                  <div className="py-4 text-center px-2">
                    <p className="text-sm text-gray-500 mb-2">Nenhum cliente encontrado</p>
                    {showNewClientButton && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpen(false)
                          setShowDialog(true)
                        }}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Novo Cliente
                      </Button>
                    )}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.id}
                    value={cliente.id}
                    onSelect={() => handleSelectCliente(cliente)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 sm:px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <Check
                        className={cn("h-4 w-4 shrink-0", value?.id === cliente.id ? "opacity-100" : "opacity-0")}
                      />
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        {cliente.codigo && (
                          <Badge variant="outline" className="text-xs font-mono shrink-0">
                            {cliente.codigo}
                          </Badge>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate text-sm">{cliente.nome}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {cliente.cnpj && `${cliente.cnpj}`}
                            {cliente.cpf && `${cliente.cpf}`}
                            {cliente.email && (
                              <span className="hidden sm:inline"> • {cliente.email}</span>
                            )}
                          </div>
                        </div>
                        {cliente.tem_contrato && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200 shrink-0 hidden sm:inline-flex">
                            Contrato
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showNewClientButton && (
        <ClienteFormDialog open={showDialog} onOpenChange={setShowDialog} onSuccess={handleClienteCreated} />
      )}
    </>
  )
}
