import { useState, useCallback, useRef, useEffect } from "react"

type ColumnWidths = Record<string, number>

export function useResizableColumns(
  defaultWidths: ColumnWidths,
  storageKey?: string
) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`table-cols-${storageKey}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          // merge defaults with saved (new columns get default width)
          return { ...defaultWidths, ...parsed }
        }
      } catch {}
    }
    return defaultWidths
  })

  // persist on change
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        localStorage.setItem(`table-cols-${storageKey}`, JSON.stringify(columnWidths))
      } catch {}
    }
  }, [columnWidths, storageKey])

  const resizingRef = useRef<{
    key: string
    startX: number
    startWidth: number
  } | null>(null)

  const startResize = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key] ?? 120,
    }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = ev.clientX - resizingRef.current.startX
      const newWidth = Math.max(60, resizingRef.current.startWidth + delta)
      setColumnWidths((prev) => ({ ...prev, [resizingRef.current!.key]: newWidth }))
    }

    const onMouseUp = () => {
      resizingRef.current = null
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [columnWidths])

  const resetWidths = useCallback(() => {
    setColumnWidths(defaultWidths)
    if (storageKey && typeof window !== "undefined") {
      localStorage.removeItem(`table-cols-${storageKey}`)
    }
  }, [defaultWidths, storageKey])

  return { columnWidths, startResize, resetWidths }
}
