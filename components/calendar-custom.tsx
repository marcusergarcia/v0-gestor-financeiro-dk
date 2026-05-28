"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarCustomProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  highlightedDates?: Date[]
  datesWithPeriods?: { date: Date; manha: boolean; tarde: boolean; integral: boolean }[]
  className?: string
}

export function CalendarCustom({
  selectedDate,
  onDateSelect,
  highlightedDates = [],
  datesWithPeriods = [],
  className,
}: CalendarCustomProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date())

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const isHighlighted = (date: Date) => {
    return highlightedDates.some((d) => isSameDay(d, date))
  }

  const getPeriodIndicators = (date: Date) => {
    const periodData = datesWithPeriods.find((d) => isSameDay(d.date, date))
    return periodData || { manha: false, tarde: false, integral: false }
  }

  const isSelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8 bg-transparent">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 bg-transparent">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const highlighted = isHighlighted(day)
          const selected = isSelected(day)
          const today = isToday(day)
          const periods = getPeriodIndicators(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "aspect-square p-0 font-normal rounded-lg hover:bg-accent hover:text-accent-foreground transition-all relative border-2 border-transparent",
                highlighted &&
                  !selected &&
                  "bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-300 font-semibold text-emerald-900 shadow-sm",
                selected && "border-red-500",
                today && !selected && "border-2 border-orange-400 bg-orange-50 font-semibold",
                "text-sm flex flex-col items-center justify-center",
              )}
            >
              {today && <span className="text-[8px] font-bold text-orange-600 leading-none mb-0.5">Hoje</span>}
              <span className={today ? "text-xs" : ""}>{day.getDate()}</span>
              {(periods.manha || periods.tarde || periods.integral) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {periods.manha && (
                    <div
                      className="w-2 h-2 rounded-full bg-blue-600 border border-blue-800 shadow-sm"
                      title="Manhã"
                    ></div>
                  )}
                  {periods.tarde && (
                    <div
                      className="w-2 h-2 rounded-full bg-orange-600 border border-orange-800 shadow-sm"
                      title="Tarde"
                    ></div>
                  )}
                  {periods.integral && (
                    <div
                      className="w-2 h-2 rounded-full bg-green-600 border border-green-800 shadow-sm"
                      title="Integral"
                    ></div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
