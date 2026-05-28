"use client"

import React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useResizableColumns } from "@/hooks/use-resizable-columns"
import { useSortableTable } from "@/hooks/use-sortable-table"

export interface ColumnDef<T = Record<string, unknown>> {
  /** Unique key — also used as the sort/accessor key on the data object */
  key: string
  label: string
  /** Default pixel width */
  width?: number
  /** Minimum pixel width when resizing (default 60) */
  minWidth?: number
  /** Enable click-to-sort on this column (default false) */
  sortable?: boolean
  /** Custom accessor for sorting — if omitted, uses `key` */
  accessor?: (row: T) => unknown
  /** Align cell content */
  align?: "left" | "center" | "right"
  /** Do not allow resizing this column */
  noResize?: boolean
  /**
   * Stick this column to the right edge when the table scrolls horizontally.
   * Perfect for action columns on mobile. Defaults to true when noResize is true.
   */
  sticky?: boolean
}

interface ResizableTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  /** Function to render a cell given the row and column key */
  renderCell: (row: T, colKey: string, rowIndex: number) => React.ReactNode
  /** Unique key used to persist column widths in localStorage */
  storageKey?: string
  /** Row key extractor */
  rowKey?: (row: T, index: number) => string | number
  /** Additional className on the wrapper div */
  className?: string
  /** Show empty state when data is empty */
  emptyState?: React.ReactNode
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void
  /** Extra classes applied to each row */
  rowClassName?: (row: T, index: number) => string
}

export function ResizableTable<T extends object>({
  columns,
  data,
  renderCell,
  storageKey,
  rowKey,
  className,
  emptyState,
  onRowClick,
  rowClassName,
}: ResizableTableProps<T>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  // Build default widths map
  const defaultWidths = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const col of columns) map[col.key] = col.width ?? 120
    return map
  }, [columns])

  const { columnWidths, startResize } = useResizableColumns(defaultWidths, storageKey)
  const { sort, toggleSort, sortedData } = useSortableTable(data)

  // Determine which columns are sticky (noResize columns default to sticky)
  const stickyKeys = React.useMemo(
    () => new Set(columns.filter((c) => c.sticky === true || (c.noResize && c.sticky !== false)).map((c) => c.key)),
    [columns]
  )

  // Track scroll state for the shadow indicator
  const handleScroll = React.useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    setIsScrolled(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    handleScroll()
    el.addEventListener("scroll", handleScroll, { passive: true })
    const ro = new ResizeObserver(handleScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", handleScroll)
      ro.disconnect()
    }
  }, [handleScroll])

  return (
    <div className={cn("relative w-full", className)}>
      {/* Left shadow — appears when table is scrolled right */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-20 transition-opacity duration-200",
          "bg-gradient-to-r from-black/10 to-transparent",
          isScrolled ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Right shadow — appears when there's more content to scroll */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-20 transition-opacity duration-200",
          "bg-gradient-to-l from-black/10 to-transparent",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />

      <div ref={wrapperRef} className="w-full overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ tableLayout: "fixed" }}
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: columnWidths[col.key] }} />
            ))}
          </colgroup>

          {/* ── Header ─────────────────────────────────────── */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => {
                const isSorted = sort.key === col.key
                const isAsc = isSorted && sort.dir === "asc"
                const isDesc = isSorted && sort.dir === "desc"
                const isSticky = stickyKeys.has(col.key)

                return (
                  <th
                    key={col.key}
                    className={cn(
                      "relative select-none px-3 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide",
                      "border-r border-gray-200 last:border-r-0",
                      col.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      isSorted && "bg-blue-50 text-blue-700",
                      // Sticky column styles
                      isSticky && "sticky right-0 z-10 bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]",
                      isSticky && isSorted && "bg-blue-50"
                    )}
                    style={{ width: columnWidths[col.key], overflow: "hidden" }}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    {/* Label + sort icon */}
                    <div
                      className={cn(
                        "flex items-center gap-1 overflow-hidden",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                      )}
                    >
                      <span className="truncate">{col.label}</span>
                      {col.sortable && (
                        <span className="flex-shrink-0">
                          {isAsc ? (
                            <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : isDesc ? (
                            <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Resize handle */}
                    {!col.noResize && (
                      <div
                        className={cn(
                          "absolute right-0 top-0 h-full w-3 flex items-center justify-center",
                          "cursor-col-resize opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100",
                          "z-10"
                        )}
                        onMouseDown={(e) => startResize(col.key, e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Arraste para redimensionar"
                      >
                        <div className="w-0.5 h-4 bg-blue-400 rounded-full" />
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────── */}
          <tbody>
            {sortedData.length === 0 && emptyState ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row, idx) : idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group border-b border-gray-100 transition-colors",
                    "hover:bg-blue-50/40",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row, idx)
                  )}
                >
                  {columns.map((col) => {
                    const isSticky = stickyKeys.has(col.key)
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2.5 overflow-hidden",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          // Sticky column: solid backgrounds to cover scrolled content
                          // group-hover:bg-blue-50 matches the row hover so it blends in
                          isSticky && "sticky right-0 z-10 bg-white group-hover:bg-blue-50/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                        )}
                        style={{ maxWidth: columnWidths[col.key] }}
                      >
                        {renderCell(row, col.key, idx)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
