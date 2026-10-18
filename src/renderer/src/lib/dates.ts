import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/** Hoy como "YYYY-MM-DD" en la hora local del PC. */
export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** "2026-10-20" → "20 oct". */
export function formatDueDate(dueDate: string): string {
  return format(parseISO(dueDate), 'd MMM', { locale: es })
}
