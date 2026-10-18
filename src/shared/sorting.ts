import type { SortCriterion, Task } from './types'

type Comparator = (a: Task, b: Task) => number

/** Fecha límite más cercana primero; sin fecha, al final. */
const byDueDate: Comparator = (a, b) => {
  if (a.dueDate === b.dueDate) return 0
  if (a.dueDate === undefined) return 1
  if (b.dueDate === undefined) return -1
  return a.dueDate < b.dueDate ? -1 : 1
}

/** Más antigua primero. */
const byCreation: Comparator = (a, b) =>
  a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0

const byPriority: Comparator = (a, b) => b.priority - a.priority

const byPersonalOrder: Comparator = (a, b) => a.personalOrder - b.personalOrder

const COMPARATORS: Record<SortCriterion, Comparator[]> = {
  // !!! primero; empates: fecha límite más cercana, luego la más antigua.
  prioridad: [byPriority, byDueDate, byCreation],
  // Las vencidas quedan arriba porque su fecha es la más antigua; sin fecha, al final.
  tiempoRestante: [byDueDate, byCreation],
  fechaCreacion: [byCreation],
  personalizado: [byPersonalOrder, byCreation]
}

/** Ordena las tareas de un área según su criterio. No modifica el arreglo original. */
export function sortTasks(tasks: Task[], criterion: SortCriterion): Task[] {
  const comparators = COMPARATORS[criterion]
  return [...tasks].sort((a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b)
      if (result !== 0) return result
    }
    return 0
  })
}
