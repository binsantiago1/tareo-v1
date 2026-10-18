import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/** Hoy como "YYYY-MM-DD" en la hora local del PC. */
export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Momento ISO → "20 oct 2026" (hora local). */
export function formatCompletedDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: es })
}

/** "2026-10-20" → "20 oct". */
export function formatDueDate(dueDate: string): string {
  return format(parseISO(dueDate), 'd MMM', { locale: es })
}

/** Texto del contador de días restantes: «Hoy», «1 día», «4 días». */
export function formatDaysLeft(days: number): string {
  if (days <= 0) return 'Hoy'
  return days === 1 ? '1 día' : `${days} días`
}
