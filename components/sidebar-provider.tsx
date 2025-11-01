"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const checkScreenSize = () => {
      if (typeof window !== "undefined") {
        const mobile = window.innerWidth < 1024
        setIsMobile(mobile)

        if (mobile) {
          // Em mobile, o sidebar começa fechado
          setIsOpen(false)
          setIsCollapsed(false)
        } else {
          // Em desktop, o sidebar começa aberto
          setIsOpen(true)
          // Manter o estado de collapsed do usuário
        }
      }
    }

    checkScreenSize()

    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkScreenSize)
      return () => window.removeEventListener("resize", checkScreenSize)
    }
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      // Em mobile, toggle apenas abre/fecha
      setIsOpen(!isOpen)
    } else {
      // Em desktop, toggle colapsa/expande
      setIsCollapsed(!isCollapsed)
    }
  }

  const toggle = toggleSidebar

  // Não renderizar até estar montado para evitar hidratação
  if (!isMounted) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleSidebar,
        isMobile,
        isCollapsed,
        setIsCollapsed,
        toggle,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
