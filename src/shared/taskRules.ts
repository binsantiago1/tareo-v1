import type { Subtask, Task } from './types'

/**
 * Reglas de completado de una tarea:
 * - Sin subtareas: se completa con su propia casilla (no se toca aquí).
 * - Con subtareas: está completada si y solo si todas sus subtareas lo están.
 */
export function withSubtaskCompletion(task: Task, now: string): Task {
  if (task.subtasks.length === 0) return task
  const allDone = task.subtasks.every((s) => s.completed)
  if (allDone === task.completed) return task
  return { ...task, completed: allDone, completedAt: allDone ? now : undefined }
}

export function toggleTaskCompleted(task: Task, now: string): Task {
  // Una tarea con subtareas no se marca a mano: se completa sola.
  if (task.subtasks.length > 0) return task
  const completed = !task.completed
  return { ...task, completed, completedAt: completed ? now : undefined }
}

export function toggleSubtaskCompleted(task: Task, subtaskId: string, now: string): Task {
  const subtasks: Subtask[] = task.subtasks.map((s) =>
    s.id === subtaskId ? { ...s, completed: !s.completed } : s
  )
  return withSubtaskCompletion({ ...task, subtasks }, now)
}

export function addSubtaskTo(task: Task, subtask: Subtask, now: string): Task {
  return withSubtaskCompletion({ ...task, subtasks: [...task.subtasks, subtask] }, now)
}

export function removeSubtaskFrom(task: Task, subtaskId: string, now: string): Task {
  const subtasks = task.subtasks.filter((s) => s.id !== subtaskId)
  if (subtasks.length === 0 && task.subtasks.length > 0) {
    // Se quedó sin subtareas: vuelve a ser una tarea normal, pendiente.
    return { ...task, subtasks, completed: false, completedAt: undefined }
  }
  return withSubtaskCompletion({ ...task, subtasks }, now)
}

/**
 * Saca una tarea del Archivo. Una tarea con subtareas solo está completa si todas lo están,
 * así que se deja pendiente la última subtarea (el resto del avance se conserva).
 */
export function restoreTask(task: Task): Task {
  const subtasks =
    task.subtasks.length > 0
      ? task.subtasks.map((s, i) =>
          i === task.subtasks.length - 1 ? { ...s, completed: false } : s
        )
      : task.subtasks
  return { ...task, subtasks, completed: false, completedAt: undefined }
}

/** Una fecha límite ("YYYY-MM-DD") está vencida si es anterior a hoy. */
export function isOverdue(dueDate: string | undefined, today: string): boolean {
  return dueDate !== undefined && dueDate < today
}

/** Días que faltan para una fecha límite ("YYYY-MM-DD"): lunes 1 → viernes 5 = 4. Negativo si ya venció. */
export function daysUntil(dueDate: string, today: string): number {
  const toUtc = (iso: string): number => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(dueDate) - toUtc(today)) / 86_400_000)
}
