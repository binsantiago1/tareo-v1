import type { Task } from './types'

/** Días que una tarea completada se queda en el Archivo antes de borrarse sola. */
export const ARCHIVE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

function expiresAt(task: Task): number | undefined {
  if (!task.completed || !task.completedAt) return undefined
  const completed = Date.parse(task.completedAt)
  return Number.isNaN(completed) ? undefined : completed + ARCHIVE_DAYS * DAY_MS
}

/** ¿Lleva esta tarea archivada más de 7 días? (Se cuenta desde que se completó.) */
export function isArchiveExpired(task: Task, now: number): boolean {
  const expires = expiresAt(task)
  return expires !== undefined && now >= expires
}

/** Días que le quedan a una tarea archivada antes de borrarse (se redondea hacia arriba). */
export function archiveDaysLeft(task: Task, now: number): number | undefined {
  const expires = expiresAt(task)
  return expires === undefined ? undefined : Math.max(Math.ceil((expires - now) / DAY_MS), 0)
}
