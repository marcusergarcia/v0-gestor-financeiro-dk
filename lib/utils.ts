import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de moeda
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  if (isNaN(numValue)) return "R$ 0,00"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue)
}

// Formatação de data - VERSÃO DEFINITIVA SEM CONVERSÃO DE TIMEZONE
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"

  try {
    let year: string
    let month: string
    let day: string

    if (typeof date === "string") {
      // Remove qualquer informação de hora
      const dateOnly = date.split("T")[0].trim()

      // Valida e extrai YYYY-MM-DD
      const parts = dateOnly.split("-")
      if (parts.length !== 3) return "-"

      year = parts[0]
      month = parts[1]
      day = parts[2]

      // Valida se são números válidos
      if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
        return "-"
      }
    } else if (date instanceof Date) {
      if (isNaN(date.getTime())) return "-"

      // Extrai os componentes diretamente do objeto Date
      year = String(date.getFullYear())
      month = String(date.getMonth() + 1).padStart(2, "0")
      day = String(date.getDate()).padStart(2, "0")
    } else {
      return "-"
    }

    // Retorna DD/MM/YYYY
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error("Erro ao formatar data:", error, date)
    return "-"
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-"

  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "-"
    return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  } catch {
    return "-"
  }
}

// Formatação de documentos
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return ""

  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length !== 14) return cnpj

  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/)
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`
  }
  return cnpj
}

export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return ""

  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return cpf

  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
  }
  return cpf
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ""

  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
  } else if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
  }
  return phone
}

export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return ""

  const cleaned = cep.replace(/\D/g, "")
  if (cleaned.length !== 8) return cep

  const match = cleaned.match(/^(\d{5})(\d{3})$/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }
  return cep
}

// Validações
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false

  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(cleaned[i]) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== Number.parseInt(cleaned[12])) return false

  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += Number.parseInt(cleaned[i]) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return digit === Number.parseInt(cleaned[13])
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false

  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleaned[i]) * (10 - i)
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== Number.parseInt(cleaned[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleaned[i]) * (11 - i)
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return digit === Number.parseInt(cleaned[10])
}

export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utilitários de data
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Para datas ISO completas, extrair apenas YYYY-MM-DD
    if (typeof dateString === "string" && dateString.includes("T")) {
      const dateOnly = dateString.split("T")[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        return dateOnly
      }
    }

    // Para formato DD/MM/YYYY, converter para YYYY-MM-DD
    if (typeof dateString === "string" && dateString.includes("/")) {
      const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (match) {
        const [, day, month, year] = match
        return `${year}-${month}-${day}`
      }
    }

    return ""
  } catch {
    return ""
  }
}

// Utilitários de string
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + "..."
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// Utilitários de performance
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Utilitários de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

// Utilitários de ID
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function generateBrandAcronym(brandName: string): string {
  if (!brandName || typeof brandName !== "string") {
    return "XX"
  }

  const words = brandName.trim().split(/\s+/)

  if (words.length === 1) {
    const word = words[0].toUpperCase()
    return word.length >= 2 ? word.substring(0, 2) : word.padEnd(2, "X")
  }

  const acronym = words
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2)

  return acronym.padEnd(2, "X")
}
