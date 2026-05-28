import { useState, useMemo, useCallback } from "react"

export type SortDir = "asc" | "desc" | null

export interface SortState {
  key: string | null
  dir: SortDir
}

export function useSortableTable<T>(data: T[]) {
  const [sort, setSort] = useState<SortState>({ key: null, dir: null })

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" }
      if (prev.dir === "asc") return { key, dir: "desc" }
      if (prev.dir === "desc") return { key: null, dir: null }
      return { key, dir: "asc" }
    })
  }, [])

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.dir) return data

    const key = sort.key
    const dir = sort.dir

    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[key]
      const bv = (b as Record<string, unknown>)[key]

      // nulls go to the end
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1

      let cmp = 0
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv
      } else if (av instanceof Date && bv instanceof Date) {
        cmp = av.getTime() - bv.getTime()
      } else {
        cmp = String(av).localeCompare(String(bv), "pt-BR", { sensitivity: "base" })
      }

      return dir === "asc" ? cmp : -cmp
    })
  }, [data, sort])

  return { sort, toggleSort, sortedData }
}
